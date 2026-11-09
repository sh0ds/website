#!/usr/bin/env python3
# preview.py: live preview on http://localhost:8000. Rebuilds the posts when a
# source file changes and reloads the browser tab on every save. Python stdlib only.
import http.server, os, subprocess, sys, threading, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WATCH = ["index.html", "404.html", "content", "templates", "stylesheets"]
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
RELOAD = """<script>(()=>{let v="%s";setInterval(async()=>{try{const r=await fetch('/__v');const t=await r.text();if(t!==v)location.reload();v=t}catch(e){}},300)})()</script>"""

version = "0"

def newest():
    m = 0.0
    for w in WATCH:
        p = os.path.join(ROOT, w)
        for d, _, files in os.walk(p) if os.path.isdir(p) else [(ROOT, [], [w])]:
            for f in files:
                try:
                    m = max(m, os.stat(os.path.join(d, f)).st_mtime)
                except FileNotFoundError:
                    pass
    return m

def build():
    subprocess.run(["rm", "-rf", "blog", "projects"], cwd=ROOT)
    r = subprocess.run(["./build/3sgc", ROOT, "build"], cwd=ROOT, capture_output=True, text=True)
    print(time.strftime("%H:%M:%S"), (r.stdout + r.stderr).strip() or "built")

def watch():
    global version
    last = newest()
    while True:
        time.sleep(0.2)
        m = newest()
        if m != last:
            last = m
            build()
            version = str(m)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__v":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(version.encode())
            return
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if path.endswith(".html") and os.path.isfile(path):
            with open(path, "rb") as f:
                body = f.read().replace(b"</body>", (RELOAD % version).encode() + b"</body>")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

if __name__ == "__main__":
    os.chdir(ROOT)
    subprocess.run(["make", "-s"], cwd=ROOT, check=True)
    build()
    threading.Thread(target=watch, daemon=True).start()
    print(f"preview on http://localhost:{PORT}  (Ctrl+C stops it)")
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
