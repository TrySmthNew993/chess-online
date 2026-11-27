#!/usr/bin/env python3
"""
KnightLink LAN server — serves the chess site AND a tiny message relay,
so two devices on the same Wi-Fi can play even with NO internet access.

Usage:
    python3 server.py            # port 8080
    python3 server.py 9000       # custom port

Then open the printed http://<your-LAN-IP>:<port> address on both devices.
Only Python 3 standard library is required.
"""
import json
import os
import socket
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
MAX_MESSAGES = 500
ROOM_TTL_SECONDS = 6 * 3600
LONG_POLL_SECONDS = 20

rooms = {}  # code -> {"seq": int, "messages": [...], "touched": float}
cond = threading.Condition()


def get_room(code):
    room = rooms.get(code)
    if room is None:
        room = {"seq": 0, "messages": [], "touched": time.time()}
        rooms[code] = room
    room["touched"] = time.time()
    return room


def prune_rooms():
    cutoff = time.time() - ROOM_TTL_SECONDS
    for code in [c for c, r in rooms.items() if r["touched"] < cutoff]:
        del rooms[code]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if not self.path.startswith("/relay/"):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _room_code(self, path):
        code = path[len("/relay/room/"):].strip("/")
        return "".join(ch for ch in code if ch.isalnum() or ch in "_-")[:64]

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        url = urlparse(self.path)
        if url.path.endswith("/relay/ping"):
            return self._json(200, {"ok": True, "server": "knightlink-lan"})
        if "/relay/room/" in url.path:
            code = self._room_code(url.path[url.path.index("/relay/room/"):])
            qs = parse_qs(url.query)
            since = int((qs.get("since") or ["0"])[0] or 0)
            me = (qs.get("me") or [""])[0]
            deadline = time.time() + LONG_POLL_SECONDS
            with cond:
                room = get_room(code)
                while True:
                    msgs = [m for m in room["messages"] if m["seq"] > since and m["from"] != me]
                    remaining = deadline - time.time()
                    if msgs or remaining <= 0:
                        break
                    cond.wait(timeout=remaining)
                seq = room["seq"]
            return self._json(200, {"messages": msgs, "seq": seq})
        return super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        if "/relay/room/" not in url.path:
            return self._json(404, {"error": "not found"})
        code = self._room_code(url.path[url.path.index("/relay/room/"):])
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 64 * 1024:
            return self._json(400, {"error": "bad length"})
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            sender = str(payload.get("from", ""))[:64]
            data = str(payload.get("data", ""))
        except Exception:
            return self._json(400, {"error": "bad json"})
        with cond:
            room = get_room(code)
            room["seq"] += 1
            room["messages"].append({"seq": room["seq"], "from": sender, "data": data})
            if len(room["messages"]) > MAX_MESSAGES:
                room["messages"] = room["messages"][-MAX_MESSAGES:]
            prune_rooms()
            cond.notify_all()
            seq = room["seq"]
        return self._json(200, {"ok": True, "seq": seq})


def lan_ips():
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except Exception:
        pass
    return sorted(ip for ip in ips if not ip.startswith("127."))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.daemon_threads = True
    print("KnightLink LAN server running. Open on any device on this network:")
    print(f"  http://localhost:{port}")
    for ip in lan_ips():
        print(f"  http://{ip}:{port}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
