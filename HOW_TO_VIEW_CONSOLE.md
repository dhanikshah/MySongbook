# How to View Console Logs

## Quick Method (Keyboard Shortcuts)

### On Mac (macOS)
- **Chrome/Edge/Brave**: Press `Cmd + Option + J` (or `Cmd + Option + I` then click "Console" tab)
- **Firefox**: Press `Cmd + Option + K` (or `Cmd + Option + I` then click "Console" tab)
- **Safari**: Press `Cmd + Option + C` (first enable Developer menu: Safari → Preferences → Advanced → Show Develop menu)

### On Windows/Linux
- **Chrome/Edge/Brave**: Press `Ctrl + Shift + J` (or `Ctrl + Shift + I` then click "Console" tab)
- **Firefox**: Press `Ctrl + Shift + K` (or `Ctrl + Shift + I` then click "Console" tab)

## Step-by-Step Method

### Chrome/Edge/Brave
1. **Right-click** anywhere on the webpage
2. Click **"Inspect"** or **"Inspect Element"**
3. A panel will open at the bottom or side
4. Click the **"Console"** tab at the top of the panel

### Firefox
1. **Right-click** anywhere on the webpage
2. Click **"Inspect"** or **"Inspect Element"**
3. A panel will open at the bottom or side
4. Click the **"Console"** tab at the top of the panel

### Safari (Mac only)
1. First enable Developer menu:
   - Go to **Safari → Preferences** (or Settings)
   - Click **"Advanced"** tab
   - Check **"Show Develop menu in menu bar"**
2. Then: **Develop → Show JavaScript Console**
   - Or press `Cmd + Option + C`

## What You'll See

Once the console is open, you'll see:
- **Console tab**: Shows all `console.log()` messages, errors, and warnings
- **Network tab**: Shows all HTTP requests (useful for debugging API calls)
- **Elements tab**: Shows the HTML structure

## For This Project

When testing auto-populate:
1. Open console using one of the methods above
2. Go to **Console** tab
3. Upload a file in the Add Song screen
4. Watch for logs like:
   - `handleFile called with...`
   - `Extraction result...`
   - `=== handleTextExtracted CALLED ===`
   - `🔍 extractedText state changed...`

## Tips

- **Clear console**: Click the 🚫 icon or press `Cmd/Ctrl + K`
- **Filter logs**: Type in the filter box (e.g., "Extraction" to see only extraction logs)
- **Preserve logs**: Check "Preserve log" to keep logs when navigating
- **Copy logs**: Right-click on any log message → Copy

## Screenshot Locations

The Console tab is usually:
- At the **bottom** of the developer panel (default)
- Or on the **right side** if you changed the layout
- Look for tabs: **Elements**, **Console**, **Sources**, **Network**, etc.

## Quick Test

To verify console is working:
1. Open console
2. Type: `console.log("Test")` and press Enter
3. You should see "Test" appear in the console

