"""
  1. WORKING DIRECTORY: sqlite3.connect("wis.db") resolves relative to
     whatever the current working directory happens to be when the
     process starts. 
     So we explicitly chdir() to this file's own directory
     first, before backend (and therefore wis.db) is ever touched. This
     also means wis.db always lives right next to main.py / CyberTrade.exe
     — exactly where your setup scripts already created it.

  2. LOGIN SNAPSHOT: This app doesn't have an explicit login screen,
     so "launching the app" IS the login event — we call it once here,
     before the window opens.
=============================================================================
"""

import os
import sys

#Fix the working directory BEFORE importing backend/api
    # getattr(sys, "frozen", False) is True when running as a PyInstaller .exe.
if getattr(sys, "frozen", False):
    APP_DIR = os.path.dirname(sys.executable) # exe mode, gives path to app.exe
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__)) #python script mode
os.chdir(APP_DIR)

import webview  # noqa: E402  (always import after chdir)
from api import Api  # noqa: E402
import backend  # noqa: E402


def resource_path(relative_path):
    """
    Resolve a path to a bundled resource (the frontend/ folder) both:
    -when run normally main.py (no sys._Meipass) 
    and
    -when frozen by PyInstaller (which unpacks bundled data into a temp folder referenced by sys._MEIPASS).
    """
    base_path = getattr(sys, "_MEIPASS", APP_DIR)
    return os.path.join(base_path, relative_path)


def main():
    # Log today's net worth snapshot once per app launch, so the dashboard's
    # growth chart gets a new data point.
    try:
        backend.log_networth_snapshot()
    except Exception as e:
        print(f"[startup] Could not log net worth snapshot: {e}")

    api = Api()
    start_url = resource_path(os.path.join("frontend", "dashboard.html")) #building the path to main page's frontend

    webview.create_window(
        "What if - Trading",
        start_url,
        js_api=api,
        width=1440,
        height=900,
        min_size=(1024, 700),
        background_color="#0a0c10",
    )
    webview.start(debug=False)


if __name__ == "__main__":
    main()
