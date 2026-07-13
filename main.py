"""
  1. WORKING DIRECTORY: 
        A. RESOURCE_DIR — read-only files bundled INTO the app (your frontend/
            HTML/CSS/JS). Fine to ship inside the packaged app, since nothing
            ever needs to write to them.

        B. DATA_DIR — writable user data (wis.db, .env). This CANNOT safely
            live "next to the executable" cross-platform:
            
            Instead, DATA_DIR uses `platformdirs`, which picks the OS's actual
            standard "app data" folder:
            - Windows: C:\\Users\\<you>\\AppData\\Local\\CyberTrade\\
            - macOS:   ~/Library/Application Support/CyberTrade/
            - Linux:   ~/.local/share/CyberTrade/
            wis.db and .env live there, and main.py chdir()s into it before
            backend/__init__.py is ever imported — so its `sqlite3.connect
            ("wis.db")` (a relative path) always resolves to the right place,
            on every OS, without backend/__init__.py needing to know anything
            about any of this.

  2. LOGIN SNAPSHOT: This app doesn't have an explicit login screen,
     so "launching the app" IS the login event — we call it once here,
     before the window opens.
=============================================================================
"""

import os
import sys
import shutil

from platformdirs import user_data_dir

APP_NAME = "WhatifTrading"

###RESOURCE_DIR: for the .exe
if getattr(sys, "frozen", False):
    RESOURCE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable)) # exe mode, gives path to app.exe
else:
    RESOURCE_DIR = os.path.dirname(os.path.abspath(__file__)) #python script mode


def resource_path(relative_path):
    #Path to the bundled, read-only resource (currently just frontend/).
    return os.path.join(RESOURCE_DIR, relative_path)


###DATA_DIR: where wis.db / .env live
DATA_DIR = user_data_dir(APP_NAME, appauthor=False)
os.makedirs(DATA_DIR, exist_ok=True)

# First launch on this machine: drop a template .env + a README right in DATA_DIR 
if not os.path.exists(os.path.join(DATA_DIR, ".env")):
    example = resource_path(".env.example")
    if os.path.exists(example):
        shutil.copy(example, os.path.join(DATA_DIR, ".env"))
    with open(os.path.join(DATA_DIR, "READ ME - add your API key here.txt"), "w") as f:
        f.write(
            "What if - Trading stores its database and settings in this folder.\n\n"
            "To get live stock prices working, open the '.env' file in this\n"
            "same folder with a text editor and paste in a free API key from\n"
            "https://finnhub.io/register\n"
        )

os.chdir(DATA_DIR)

import webview  # noqa: E402 
from api import Api 
import backend  

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
