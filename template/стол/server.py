"""Монтажный стол: python3 server.py [порт] → http://localhost:8091
Отдаёт страницу и медиа (с поддержкой Range для перемотки видео), выбор хранит в selection.json.
"""
import json
import os
import re
import sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
SEL = HERE / "selection.json"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(HERE), **kw)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api") else "max-age=60")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/selection":
            body = SEL.read_bytes() if SEL.exists() else b"null"
            return self._send(200, body, "application/json")
        rng = self.headers.get("Range")
        path = Path(self.translate_path(self.path))
        if rng and path.is_file():
            return self._range(path, rng)
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/selection":
            return self._send(404, b"{}", "application/json")
        data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        data["savedAt"] = datetime.now().isoformat(timespec="seconds")
        SEL.write_text(json.dumps(data, ensure_ascii=False, indent=1))
        return self._send(200, json.dumps({"ok": True, "savedAt": data["savedAt"]}).encode(), "application/json")

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _range(self, path, rng):
        size = path.stat().st_size
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        start = int(m.group(1)) if m.group(1) else 0
        end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        with open(path, "rb") as f:
            f.seek(start)
            left = end - start + 1
            while left > 0:
                chunk = f.read(min(1 << 16, left))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                left -= len(chunk)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
    print(f"Монтажный стол: http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
