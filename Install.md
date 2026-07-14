# Getting Started

What if - Trading is a free desktop app for tracking a virtual stock portfolio
with live prices. No installation of Python, or anything else, is
required — just download and run.

Pick your operating system below:

- [Windows](#windows)
- [macOS](#macos)

---

## Windows

### 1. Download the app

1. Go to the **[Releases](../../releases)** page of this repository.
2. Under the latest release, download **`WhatifTrading-Windows.zip`**.
3. Right-click the zip → **Extract All...** → pick a folder (e.g. your
   Desktop).

### 2. Run it once (so it can set up its data folder)

1. Open the extracted folder and double-click **`WhatifTrading.exe`**.
2. Windows will likely show a blue **"Windows protected your PC"**
   warning. This is normal for apps not distributed through the
   Microsoft Store. Click **"More info"** → **"Run anyway"**.
3. The app window should open. You can close it again after this. 
   This first launch just creates the folder you'll need in the next step.

> If your antivirus flags or quarantines the file, that's a common false
> positive for PyInstaller-built apps generally, not unique to this
> project. Add an exception for it, or build from source (see the
> Developer section below) if you'd rather verify it yourself.

### 3. Add your free API key

Whatif - Trading uses [Finnhub](https://finnhub.io) for live stock prices —
you need your own free key, or prices won't load.

1. Go to **[finnhub.io/register](https://finnhub.io/register)** and
   create a free account. Copy your **API key** from the dashboard.
2. Open the **File Explorer** and paste this into the address bar, then
   press Enter:
   ```
   %LOCALAPPDATA%\WhatifTrading
   ```
3. You'll see a file already there named **`READ ME - add your API key
   here.txt`**, plus an `.env` file. Open `.env` in Notepad and replace
   the placeholder with your real key:
   ```
   finnhub_key=paste_your_key_here
   ```
   Save it.

### 4. Use the app

Reopen `WhatifTrading.exe`. From here on:

- **Portfolio (dashboard)** — your total portfolio value, a growth chart
  over time, and a watchlist you can invest in with one click.
- **Check Quotes** — search any ticker, view its price chart, buy in
  with a virtual dollar amount.
- **History** — every transaction you've made and its gain/loss.
- **Analytics** — overall profit/loss, win rate, performance by position.

Every "buy" is **virtual** — no real money or brokerage account is
involved, just live market prices for practice/tracking.

Your data (`wis.db`) lives in that same `%LOCALAPPDATA%\WhatifTrading`
folder — nothing is sent anywhere or synced online, and it survives
reinstalling/updating the app since it's kept separate from the app
files themselves.

### Windows troubleshooting

| Problem | Likely fix |
|---|---|
| App won't open | Right-click → Run as administrator, or make sure you extracted the zip rather than running it from inside it. |
| Blank white window | Install the free [WebView2 runtime](https://developer.microsoft.com/microsoft-edge/webview2/), then reopen the app. |
| Prices show "—" / "$0.00" everywhere | Your `.env` in `%LOCALAPPDATA%\WhatifTrading` is missing a real key, or Notepad saved it as `.env.txt` — in File Explorer's **View** tab, enable "File name extensions" to check, and rename it back to exactly `.env` if needed. |

---
<br><br>

## macOS

### 1. Download the app

1. Go to the **[Releases](../../releases)** page of this repository.
2. Under the latest release, download **`WhatifTrading-macOS.zip`**.
3. Double-click the zip to unzip it — you'll get **`WhatifTrading.app`**.
4. Drag `WhatifTrading.app` into your **Applications** folder (optional,
   but recommended — it can run from anywhere though).

### 2. Run it once (so it can set up its data folder)

1. **Right-click** (or Control-click) `WhatifTrading.app` and choose
   **Open** — don't just double-click it the first time.
2. macOS will warn that the app is from an unidentified developer.
   Click **Open** on that dialog to confirm. (This extra right-click
   step is only needed the very first time; after that, double-clicking
   works normally.)
   - If you don't see an "Open" button and instead only see "Move to
     Trash," go to  **System Settings → Privacy & Security**, scroll
     down to the security message about WhatifTrading, and click
     **"Open Anyway"**.
3. The app window should open. You can close it again after this —
   this first launch just creates the folder you'll need in the next step.

> Like the Windows build, this isn't a sign anything's wrong — it's
> standard macOS Gatekeeper behavior for any app not distributed
> through the Mac App Store or signed with a paid Apple Developer
> certificate.

### 3. Add your free API key

1. Go to **[finnhub.io/register](https://finnhub.io/register)** and
   create a free account. Copy your **API key** from the dashboard.
2. Open **Finder**, then in the menu bar click **Go → Go to Folder...**
   (or press `Cmd+Shift+G`), and paste in:
   ```
   ~/Library/Application Support/WhatifTrading
   ```
3. You'll see a file already there named **`READ ME - add your API key
   here.txt`**, plus an `.env` file. Open `.env` with **TextEdit** (right
   click → Open With → TextEdit) and replace the placeholder with your
   real key:
   ```
   finnhub_key=paste_your_key_here
   ```
   Save it.
   > If TextEdit tries to save it as `.env.rtf` or a "rich text" file,
   > use **Format → Make Plain Text** first, then save.

### 4. Use the app

Reopen WhatifTrading. From here on, it works identically to the Windows
version — see the "Use the app" section above for what each page does.

Your data (`wis.db`) lives in that same
`~/Library/Application Support/WhatifTrading` folder — nothing is sent
anywhere or synced online, and it survives reinstalling/updating the
app since it's kept separate from the app bundle itself.

### macOS troubleshooting

| Problem | Likely fix |
|---|---|
| "WhatifTrading is damaged and can't be opened" | This can happen with unsigned apps downloaded via a browser. Open Terminal and run: `xattr -cr /Applications/WhatifTrading.app`, then try opening it again. |
| Only see "Move to Trash," no "Open Anyway" | System Settings → Privacy & Security → scroll to the bottom → look for a message about WhatifTrading being blocked → click **Open Anyway** there. |
| Prices show "—" / "$0.00" everywhere | Double-check `~/Library/Application Support/WhatifTrading/.env` has your real key and saved as plain text, not `.env.rtf`. |

---
<br><br>

## For Developers (running from source, or building for another OS)

**Important:** PyInstaller can only build for the operating system
it's currently running on — you can't build a macOS `.app` from a
Windows machine or vice versa. To publish both, you'll need to either
build on both OSes yourself, or use a CI service (e.g. GitHub Actions
with a `windows-latest` and a `macos-latest` job) to build both
automatically from the same source whenever you tag a release.

See [`README.md`](./README.md) in this repository for source setup
instructions (Python dependencies, Finnhub API key, database setup).
