#!/usr/bin/env python3
# servidor.py – HTTP simples + live-reload para site estático
import http.server
import socketserver
import webbrowser
import pathlib
import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

PORT = 8000
DIRETORIO = pathlib.Path(__file__).parent

class RecarregaPagina(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        # ignora .git, __pycache__, etc
        if any(p.startswith('.') for p in event.src_path.split(os.sep)):
            return
        print(f'[Reload] {event.src_path} alterado – recarregando...')
        # abre nova aba (simples, mas funciona)
        webbrowser.open_new(f'http://localhost:{PORT}/')

def inicia_servidor():
    os.chdir(DIRETORIO)
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"[Servidor] Rodando em http://localhost:{PORT}")
        print("[Servidor] Ctrl+C para parar")
        httpd.serve_forever()

def inicia_observador():
    event_handler = RecarregaPagina()
    observer = Observer()
    observer.schedule(event_handler, str(DIRETORIO), recursive=True)
    observer.start()
    print("[Observador] Monitorando alterações...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == '__main__':
    # abre navegador
    webbrowser.open_new(f'http://localhost:{PORT}/')
    # servidor em thread separada
    thread_srv = threading.Thread(target=inicia_servidor, daemon=True)
    thread_srv.start()
    # observador de arquivos
    try:
        inicia_observador()
    except KeyboardInterrupt:
        print("\n[Servidor] Encerrado.")