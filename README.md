# ♞ KnightLink Chess — Online P2P & Local Chess for GitHub Pages

A clean, mobile- and desktop-friendly chess web app that runs **100% as a static site on GitHub Pages** while supporting **real-time online multiplayer across different networks or the same LAN** (via WebRTC / PeerJS) as well as **Same-Device Pass & Play**.

## ✨ Features

- **🌐 Play Online Across Any Network or LAN (Zero Backend Needed)**:
  - Uses **WebRTC DataChannels (PeerJS)** so two browsers connect directly peer-to-peer.
  - Create a room to get a **6-character Room Code** or click **Copy Invite Link** (`?room=XXXXXX`) to send to a friend on WhatsApp, Discord, or Telegram.
  - Works on the same Wi-Fi/LAN AND across completely different networks (mobile data, home Wi-Fi, etc.) right from GitHub Pages.
- **📱 Same-Device Local Mode**:
  - Pass & Play on a single phone, tablet, or PC with optional **Auto-Flip Board** after each turn.
- **⏱️ Full Chess Clocks & Increments**:
  - **Bullet**: `1+0`, `2+1`
  - **Blitz**: `3+0`, `3+2`, `5+0`, `5+3`
  - **Rapid & Classical**: `10+0`, `15+10`, `30+0`
  - **Unlimited (`∞`)** or **Custom** (`1–180` mins + `0–60s` Fischer increment)
  - Tenth-of-a-second precision under 20 seconds.
- **♟️ Complete Chess Rules**:
  - Powered by `chess.js`: legal move dots & capture rings, castling, en passant, pawn promotion modal, check/checkmate, stalemate, threefold repetition, 50-move rule, insufficient material, captured piece tracker & material differential (`+1`, `+3`, etc.), PGN export, draw offers, resignation, and instant rematch.
- **🔊 Built-in Web Audio Sound Effects**:
  - Synthesized move, capture, check, and game-over sounds (no external audio files required).

---

## 🚀 How to Host on GitHub Pages

1. Create a new repository on GitHub (e.g. `chess-online`).
2. Upload these 3 files to the root of the repository:
   - `index.html`
   - `style.css`
   - `app.js`
3. Go to your repository **Settings → Pages**.
4. Under **Build and deployment → Source**, select **Deploy from a branch**, choose `main` (or `master`) and `/ (root)`, then click **Save**.
5. In ~60 seconds your chess site will be live at `https://<your-username>.github.io/<repo-name>/`!

## 💻 Running Locally on Your Machine / LAN (Even Offline)

Run the included Python LAN server (uses only Python 3 standard library):

```bash
cd chess-online
python3 server.py 8080
```
Then open `http://localhost:8080` (or the printed `http://<your-local-ip>:8080` on phones/other PCs on the same Wi-Fi). Rooms work over LAN even with no internet connection.
