import os
import sys
import socket
import webbrowser
import threading
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import time

# Configuration
PORT_RANGE = range(8000, 9000)

# Define Project Root (Assuming this script is in output/Page/start_server.py, so root is ../../)
# But we want to allow editing files in the actual project root (e.g. docs/)
# This script is at: ROOT/output/editor/start_server.py
# So PROJECT_ROOT is ../../
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class CHDRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # API: Read file
        if self.path.startswith('/api/read'):
            self.handle_read()
            return
        super().do_GET()

    def do_POST(self):
        # API: Save file
        if self.path.startswith('/api/save'):
            self.handle_save()
            return
        super().do_POST()

    def handle_read(self):
        try:
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            rel_path = params.get('path', [''])[0]
            
            if not rel_path:
                self.send_error(400, "Missing path parameter")
                return

            # Security: Prevent escaping project root
            # Normalize path
            file_path = os.path.normpath(os.path.join(BASE_DIR, rel_path))
            if not file_path.startswith(BASE_DIR):
                self.send_error(403, "Access denied: Cannot access outside project root")
                return
            
            if not os.path.exists(file_path):
                self.send_error(404, "File not found")
                return

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"content": content}).encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def handle_save(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            rel_path = data.get('path')
            content = data.get('content')

            if not rel_path or content is None:
                self.send_error(400, "Missing path or content")
                return

            file_path = os.path.normpath(os.path.join(BASE_DIR, rel_path))
            if not file_path.startswith(BASE_DIR):
                self.send_error(403, "Access denied")
                return

            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"[INFO] Saved file: {file_path}")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "path": file_path}).encode('utf-8'))

        except Exception as e:
            print(f"[ERROR] Save failed: {e}")
            self.send_error(500, str(e))

def find_available_port():
    for port in PORT_RANGE:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("localhost", port))
                return port
            except OSError:
                continue
    print("[ERROR] No available ports found.")
    sys.exit(1)

def run_server(port, root_dir):
    print(f"[INFO] Serving directory: {root_dir}")
    os.chdir(root_dir)
    handler = CHDRequestHandler
    try:
        httpd = HTTPServer(("localhost", port), handler)
        print(f"[INFO] Server running at http://localhost:{port}")
        httpd.serve_forever()
    except Exception as e:
        print(f"[ERROR] Server error: {e}")
        os._exit(1)

def main():
    # 1. Determine Context
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # The script is in output/PageName/, so root is output/
    root_dir = os.path.dirname(current_dir)
    page_name = os.path.basename(current_dir)
    
    # 2. Find Port
    port = find_available_port()
    
    # 3. Start Server (Daemon Thread)
    t = threading.Thread(target=run_server, args=(port, root_dir))
    t.daemon = True
    t.start()
    
    # 4. Wait for server to be ready (simple sleep)
    time.sleep(1)
    
    # 5. Open Browser
    # We serve root, so we access /PageName/
    url = f"http://localhost:{port}/{page_name}/"
    print(f"[INFO] Opening browser: {url}")
    webbrowser.open(url)
    
    # 6. Keep Alive
    print("[INFO] Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping...")

if __name__ == "__main__":
    main()
