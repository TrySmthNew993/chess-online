/**
 * KnightLink Net — resilient multi-transport room networking.
 *
 * Every message is sent over ALL available transports at once and de-duplicated
 * on the receiving side, so the game keeps working if any single path fails:
 *
 *   - "p2p"   : WebRTC DataChannel via PeerJS (direct on LAN, STUN/TURN across networks)
 *   - "relay" : WebSocket relay through public MQTT brokers (works behind any NAT/firewall)
 *   - "lan"   : Local relay served by server.py (works on a LAN with no internet at all)
 *
 * Usage:
 *   const net = new NetSession({ role: 'host'|'guest', code, onMessage, onStatus });
 *   await net.start();     // resolves when at least one transport is ready
 *   net.send({ type: 'move', ... });
 *   net.close();
 */
(function (global) {
  'use strict';

  const PROTOCOL = 'KL2';
  const PEER_PREFIX = 'knightlink-chess-v2-';
  const TOPIC_PREFIX = 'knightlink/v2/room/';
  const HEARTBEAT_MS = 2000;
  const PEER_TIMEOUT_MS = 8000;

  const MQTT_BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];

  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ];

  function randomId(len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    const arr = new Uint8Array(len);
    (global.crypto || window.crypto).getRandomValues(arr);
    for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
    return s;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------------------
  // Minimal MQTT 3.1.1 client over WebSocket (QoS 0 publish/subscribe only)
  // ---------------------------------------------------------------------------
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function encodeLength(n) {
    const out = [];
    do {
      let d = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) d |= 128;
      out.push(d);
    } while (n > 0);
    return out;
  }

  function mqttString(str) {
    const b = enc.encode(str);
    return [b.length >> 8, b.length & 255, ...b];
  }

  function mqttPacket(header, body) {
    return new Uint8Array([header, ...encodeLength(body.length), ...body]);
  }

  class MiniMqtt {
    constructor(url, onMessage) {
      this.url = url;
      this.onMessage = onMessage;
      this.clientId = 'kl' + randomId(16);
      this.subs = new Set();
      this.connected = false;
      this.closed = false;
      this.ws = null;
      this.buf = new Uint8Array(0);
      this.pingTimer = null;
      this.packetId = 1;
    }

    connect(timeoutMs = 8000) {
      return new Promise((resolve, reject) => {
        let settled = false;
        let ws;
        try {
          ws = new WebSocket(this.url, ['mqtt']);
        } catch (err) {
          reject(err);
          return;
        }
        ws.binaryType = 'arraybuffer';
        this.ws = ws;
        this.buf = new Uint8Array(0);

        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            try { ws.close(); } catch (_) {}
            reject(new Error('MQTT connect timeout'));
          }
        }, timeoutMs);

        this._onConnack = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve();
          }
        };

        ws.onopen = () => {
          const body = [0, 4, 77, 81, 84, 84, 4, 0x02, 0, 30, ...mqttString(this.clientId)];
          ws.send(mqttPacket(0x10, body));
        };
        ws.onmessage = (e) => this._onData(new Uint8Array(e.data));
        ws.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(new Error('MQTT socket error'));
          }
        };
        ws.onclose = () => {
          this.connected = false;
          clearInterval(this.pingTimer);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(new Error('MQTT socket closed'));
          } else if (!this.closed && this.ws === ws) {
            this._scheduleReconnect();
          }
        };
      });
    }

    _scheduleReconnect() {
      if (this.closed) return;
      setTimeout(() => {
        if (this.closed || this.connected) return;
        this.connect().catch(() => this._scheduleReconnect());
      }, 2500);
    }

    _onData(chunk) {
      const merged = new Uint8Array(this.buf.length + chunk.length);
      merged.set(this.buf);
      merged.set(chunk, this.buf.length);
      this.buf = merged;

      while (this.buf.length >= 2) {
        let mult = 1;
        let len = 0;
        let idx = 1;
        let byte;
        do {
          if (idx >= this.buf.length) return; // incomplete length
          byte = this.buf[idx++];
          len += (byte & 127) * mult;
          mult *= 128;
        } while (byte & 128);
        if (this.buf.length < idx + len) return; // incomplete packet

        const header = this.buf[0];
        const body = this.buf.slice(idx, idx + len);
        this.buf = this.buf.slice(idx + len);
        this._handlePacket(header, body);
      }
    }

    _handlePacket(header, body) {
      const type = header >> 4;
      if (type === 2) {
        // CONNACK
        if (body[1] === 0) {
          this.connected = true;
          clearInterval(this.pingTimer);
          this.pingTimer = setInterval(() => this._raw(new Uint8Array([0xc0, 0x00])), 20000);
          this.subs.forEach((t) => this._sendSubscribe(t));
          if (this._onConnack) this._onConnack();
        } else {
          try { this.ws.close(); } catch (_) {}
        }
      } else if (type === 3) {
        // PUBLISH
        const qos = (header >> 1) & 3;
        const topicLen = (body[0] << 8) | body[1];
        const topic = dec.decode(body.slice(2, 2 + topicLen));
        let pos = 2 + topicLen;
        if (qos > 0) pos += 2;
        const payload = dec.decode(body.slice(pos));
        try { this.onMessage(topic, payload); } catch (_) {}
      }
    }

    _raw(bytes) {
      if (this.ws && this.ws.readyState === 1) {
        try { this.ws.send(bytes); } catch (_) {}
      }
    }

    _sendSubscribe(topic) {
      const pid = this.packetId++ & 0xffff || 1;
      const body = [pid >> 8, pid & 255, ...mqttString(topic), 0];
      this._raw(mqttPacket(0x82, body));
    }

    subscribe(topic) {
      this.subs.add(topic);
      if (this.connected) this._sendSubscribe(topic);
    }

    publish(topic, payload) {
      if (!this.connected) return false;
      const body = [...mqttString(topic), ...enc.encode(payload)];
      this._raw(mqttPacket(0x30, body));
      return true;
    }

    close() {
      this.closed = true;
      this.connected = false;
      clearInterval(this.pingTimer);
      if (this.ws) {
        try { this._raw(new Uint8Array([0xe0, 0x00])); } catch (_) {}
        try { this.ws.close(); } catch (_) {}
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Transports
  // ---------------------------------------------------------------------------
  class RelayTransport {
    constructor(session) {
      this.name = 'relay';
      this.session = session;
      this.clients = [];
      this.ready = false;
      this.topic = TOPIC_PREFIX + session.code;
    }

    start() {
      // Connect to all brokers; ready as soon as any one connects.
      return new Promise((resolve, reject) => {
        let pending = MQTT_BROKERS.length;
        let resolved = false;
        MQTT_BROKERS.forEach((url) => {
          const client = new MiniMqtt(url, (topic, payload) => {
            if (topic === this.topic) this.session._receive(payload, 'relay');
          });
          client.subscribe(this.topic);
          client
            .connect()
            .then(() => {
              this.clients.push(client);
              this.ready = true;
              if (!resolved) {
                resolved = true;
                resolve();
              }
            })
            .catch(() => {
              client.close();
              pending--;
              if (pending === 0 && !resolved) reject(new Error('No relay broker reachable'));
            });
        });
      });
    }

    send(str) {
      this.clients.forEach((c) => c.publish(this.topic, str));
    }

    close() {
      this.ready = false;
      this.clients.forEach((c) => c.close());
      this.clients = [];
    }
  }

  class LanTransport {
    constructor(session) {
      this.name = 'lan';
      this.session = session;
      this.ready = false;
      this.closed = false;
      this.since = 0;
      this.base = 'relay/room/' + encodeURIComponent(session.code);
    }

    async start() {
      if (location.protocol === 'file:') throw new Error('LAN relay unavailable on file://');
      const res = await fetch('relay/ping', { cache: 'no-store' });
      if (!res.ok) throw new Error('LAN relay not found');
      const json = await res.json().catch(() => null);
      if (!json || !json.ok) throw new Error('LAN relay not found');
      this.ready = true;
      this._poll();
    }

    async _poll() {
      while (!this.closed) {
        try {
          const url = `${this.base}?since=${this.since}&me=${this.session.clientId}`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error('poll failed');
          const json = await res.json();
          (json.messages || []).forEach((m) => {
            this.since = Math.max(this.since, m.seq);
            this.session._receive(m.data, 'lan');
          });
          if (typeof json.seq === 'number' && json.seq < this.since) this.since = json.seq; // server restarted
        } catch (_) {
          await sleep(1500);
        }
      }
    }

    send(str) {
      if (!this.ready) return;
      fetch(this.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: this.session.clientId, data: str })
      }).catch(() => {});
    }

    close() {
      this.closed = true;
      this.ready = false;
    }
  }

  class P2PTransport {
    constructor(session) {
      this.name = 'p2p';
      this.session = session;
      this.ready = false;
      this.closed = false;
      this.peer = null;
      this.conns = new Set();
      this.dialTimer = null;
    }

    start() {
      return new Promise((resolve, reject) => {
        if (typeof global.Peer === 'undefined') {
          reject(new Error('PeerJS not loaded'));
          return;
        }
        const s = this.session;
        const opts = {
          debug: 0,
          config: {
            iceServers: ICE_SERVERS,
            iceTransportPolicy: s.options.relayOnly ? 'relay' : 'all'
          }
        };
        const peer = s.role === 'host' ? new global.Peer(PEER_PREFIX + s.code, opts) : new global.Peer(opts);
        this.peer = peer;
        let opened = false;

        const timer = setTimeout(() => {
          if (!opened) {
            try { peer.destroy(); } catch (_) {}
            reject(new Error('PeerJS signaling timeout'));
          }
        }, 10000);

        peer.on('open', () => {
          opened = true;
          clearTimeout(timer);
          this.ready = true;
          resolve();
          if (s.role === 'guest') this._dial();
        });

        peer.on('connection', (conn) => this._attach(conn));

        peer.on('error', (err) => {
          if (!opened) {
            clearTimeout(timer);
            reject(err);
            return;
          }
          if (s.role === 'guest' && err && err.type === 'peer-unavailable') {
            this._scheduleDial(3000);
          }
        });

        peer.on('disconnected', () => {
          if (!this.closed && !peer.destroyed) {
            setTimeout(() => {
              try { if (!this.closed && peer.disconnected && !peer.destroyed) peer.reconnect(); } catch (_) {}
            }, 1500);
          }
        });
      });
    }

    _hasOpen() {
      for (const c of this.conns) if (c.open) return true;
      return false;
    }

    _scheduleDial(ms) {
      if (this.closed || this.session.role !== 'guest') return;
      clearTimeout(this.dialTimer);
      this.dialTimer = setTimeout(() => this._dial(), ms);
    }

    _dial() {
      if (this.closed || !this.peer || this.peer.destroyed || this._hasOpen()) return;
      try {
        const conn = this.peer.connect(PEER_PREFIX + this.session.code, { serialization: 'json' });
        if (conn) this._attach(conn);
      } catch (_) {}
      this._scheduleDial(7000); // keep retrying until a channel is open
    }

    _attach(conn) {
      this.conns.add(conn);
      conn.on('data', (d) => {
        this.session._receive(typeof d === 'string' ? d : JSON.stringify(d), 'p2p');
      });
      const drop = () => {
        this.conns.delete(conn);
        if (!this.closed && this.session.role === 'guest' && !this._hasOpen()) this._scheduleDial(2000);
      };
      conn.on('close', drop);
      conn.on('error', drop);
    }

    send(str) {
      this.conns.forEach((c) => {
        if (c.open) {
          try { c.send(str); } catch (_) {}
        }
      });
    }

    close() {
      this.closed = true;
      this.ready = false;
      clearTimeout(this.dialTimer);
      this.conns.forEach((c) => { try { c.close(); } catch (_) {} });
      this.conns.clear();
      if (this.peer) {
        try { this.peer.destroy(); } catch (_) {}
      }
    }
  }

  const TRANSPORTS = { p2p: P2PTransport, relay: RelayTransport, lan: LanTransport };
  const TRANSPORT_LABELS = { p2p: 'Direct P2P', relay: 'Relay', lan: 'LAN Server' };

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------
  class NetSession {
    constructor({ role, code, onMessage, onStatus, transports, relayOnly }) {
      this.role = role;
      this.roleShort = role === 'host' ? 'h' : 'g';
      this.code = code;
      this.onMessage = onMessage || (() => {});
      this.onStatus = onStatus || (() => {});
      this.options = { relayOnly: !!relayOnly };
      this.clientId = randomId(12);
      this.seq = 0;
      this.seen = new Map();
      this.peerClient = null;
      this.lastSeen = 0;
      this.lastVia = {};
      this.closed = false;
      this.lastStatusKey = '';

      const names = (transports && transports.length ? transports : Object.keys(TRANSPORTS))
        .filter((n) => TRANSPORTS[n]);
      this.transports = names.map((n) => new TRANSPORTS[n](this));
    }

    start() {
      return new Promise((resolve, reject) => {
        let pending = this.transports.length;
        let resolved = false;
        const errors = [];
        if (pending === 0) {
          reject(new Error('No transports configured'));
          return;
        }
        this.transports.forEach((t) => {
          t.start()
            .then(() => {
              if (this.closed) return;
              if (!resolved) {
                resolved = true;
                this._startTimers();
                resolve();
              }
              this._emitStatus(true);
            })
            .catch((err) => {
              errors.push(`${t.name}: ${err && (err.message || err.type) || err}`);
              pending--;
              if (pending === 0 && !resolved) reject(new Error(errors.join('; ')));
            });
        });
      });
    }

    _startTimers() {
      this.hbTimer = setInterval(() => this.send({ type: '_hb' }), HEARTBEAT_MS);
      this.statusTimer = setInterval(() => {
        this._emitStatus();
        const cutoff = Date.now() - 120000;
        this.seen.forEach((t, k) => { if (t < cutoff) this.seen.delete(k); });
      }, 1000);
      this.send({ type: '_hb' });
    }

    send(msg) {
      if (this.closed) return;
      const env = JSON.stringify({ k: PROTOCOL, r: this.code, ro: this.roleShort, f: this.clientId, i: ++this.seq, m: msg });
      this.transports.forEach((t) => {
        if (t.ready) {
          try { t.send(env); } catch (_) {}
        }
      });
    }

    _receive(str, via) {
      if (this.closed) return;
      let env;
      try { env = JSON.parse(str); } catch (_) { return; }
      if (!env || env.k !== PROTOCOL || env.r !== this.code) return;
      if (env.f === this.clientId || env.ro === this.roleShort) return;

      const key = env.f + ':' + env.i;
      const now = Date.now();
      this.lastVia[via] = now;
      if (this.seen.has(key)) return;
      this.seen.set(key, now);

      // Lock onto one opponent; allow takeover only if the current one went silent.
      if (this.peerClient && env.f !== this.peerClient) {
        if (now - this.lastSeen < PEER_TIMEOUT_MS) return;
      }
      const isNewPeer = this.peerClient !== env.f;
      this.peerClient = env.f;
      this.lastSeen = now;
      if (isNewPeer) this._emitStatus(true);

      if (!env.m || env.m.type === '_hb') return;
      try { this.onMessage(env.m); } catch (err) { console.error('[net] handler error', err); }
    }

    isPeerConnected() {
      return !!this.peerClient && Date.now() - this.lastSeen < PEER_TIMEOUT_MS;
    }

    activeVia() {
      const now = Date.now();
      return Object.keys(this.lastVia).filter((k) => now - this.lastVia[k] < 6000);
    }

    readyTransports() {
      return this.transports.filter((t) => t.ready).map((t) => t.name);
    }

    describe(list) {
      const names = list || this.activeVia();
      return names.map((n) => TRANSPORT_LABELS[n] || n).join(' + ');
    }

    _emitStatus(force) {
      const connected = this.isPeerConnected();
      const via = this.activeVia().sort();
      const ready = this.readyTransports().sort();
      const key = `${connected}|${via.join(',')}|${ready.join(',')}`;
      if (!force && key === this.lastStatusKey) return;
      this.lastStatusKey = key;
      try { this.onStatus({ connected, via, ready }); } catch (_) {}
    }

    close() {
      if (this.closed) return;
      try { this.send({ type: 'bye' }); } catch (_) {}
      this.closed = true;
      clearInterval(this.hbTimer);
      clearInterval(this.statusTimer);
      // Give the "bye" a moment to flush before tearing down sockets.
      const ts = this.transports;
      setTimeout(() => ts.forEach((t) => { try { t.close(); } catch (_) {} }), 150);
    }
  }

  global.NetSession = NetSession;
  global.KnightNet = { ICE_SERVERS, MQTT_BROKERS, MiniMqtt, TRANSPORT_LABELS };
})(window);
