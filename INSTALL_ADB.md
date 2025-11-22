# Installing ADB (Android Debug Bridge)

## Method 1: Using Homebrew (Recommended for macOS)

### Step 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Android Platform Tools
```bash
brew install android-platform-tools
```

### Step 3: Verify Installation
```bash
adb version
```

You should see something like: `Android Debug Bridge version 1.0.41`

---

## Method 2: Manual Installation

### Step 1: Download Android SDK Platform Tools
1. Visit: https://developer.android.com/studio/releases/platform-tools
2. Download the ZIP file for your OS (macOS/Linux/Windows)
3. Extract the ZIP file

### Step 2: Add to PATH

**For macOS/Linux:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:/path/to/platform-tools"

# Example:
export PATH="$PATH:$HOME/Downloads/platform-tools"
```

**Then reload:**
```bash
source ~/.zshrc  # or source ~/.bashrc
```

**For Windows:**
1. Add the platform-tools folder to your System PATH
2. Or use the full path: `C:\path\to\platform-tools\adb.exe`

### Step 3: Verify Installation
```bash
adb version
```

---

## Method 3: Using Android Studio (if installed)

If you have Android Studio installed, ADB is already included:

```bash
# macOS
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"

# Linux
export PATH="$PATH:$HOME/Android/Sdk/platform-tools"

# Windows
# Add to PATH: %LOCALAPPDATA%\Android\Sdk\platform-tools
```

---

## Quick Test After Installation

1. Connect your Android device/emulator
2. Run:
   ```bash
   adb devices
   ```
3. You should see your device listed

---

## Alternative: Use Chrome DevTools (No ADB needed)

If you don't want to install ADB, you can use Chrome DevTools instead:

1. In your Android app, press `Cmd+M` (emulator) or shake device
2. Select "Debug" or "Open Debugger"
3. Chrome DevTools opens automatically
4. Go to **Console** tab to see all logs

This doesn't require ADB installation!

