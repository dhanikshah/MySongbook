# How to Check Console Logs on Android

## Method 1: Using ADB Logcat (Recommended for Android)

### Setup
1. Connect your Android device/emulator via USB or ensure it's on the same network
2. Enable USB debugging on your device:
   - Settings > About Phone > Tap "Build Number" 7 times
   - Settings > Developer Options > Enable "USB Debugging"
3. Verify connection:
   ```bash
   adb devices
   ```

### View Logs
```bash
# Filter for React Native/Expo logs
adb logcat | grep -E "ReactNativeJS|Expo|LibraryPage|SearchPage|useSongs"

# Or see all logs
adb logcat

# Clear logs and start fresh
adb logcat -c && adb logcat | grep -E "ReactNativeJS|Expo"
```

### Test Auto-Refresh
```bash
# Watch for auto-refresh logs
adb logcat -c && adb logcat | grep -E "Auto-refreshing|Fetched.*songs"
```

You should see:
- `LibraryPage: Auto-refreshing songs (silent)...`
- `SearchPage: Auto-refreshing songs (silent)...`
- `useSongs: Fetched X songs`

---

## Method 2: Using Expo Dev Tools

1. When you run `npx expo start`, you'll see a QR code
2. Press `j` in the terminal to open the debugger in your browser
3. Or visit: http://localhost:19000/debugger
4. Open Chrome DevTools (F12) to see console logs

---

## Method 3: Using React Native Debugger

1. Install React Native Debugger:
   ```bash
   brew install --cask react-native-debugger
   ```

2. Open React Native Debugger app
3. In your Expo app:
   - Shake device (physical device)
   - Or press `Cmd+M` (Android emulator)
   - Or press `Cmd+D` (iOS simulator)
4. Select "Debug" or "Open Debugger"
5. Console logs will appear in React Native Debugger

---

## Method 4: Using Chrome DevTools (Web Debugging)

1. Shake your device or press `Cmd+M` (Android emulator)
2. Select "Debug" or "Open Debugger"
3. Chrome will open with DevTools
4. Go to **Console** tab to see logs

---

## Method 5: Using Expo Go App (Built-in)

1. Open Expo Go app on your device
2. Shake device or press `Cmd+M`
3. Select "Show Dev Menu"
4. Select "Debug Remote JS"
5. Open Chrome DevTools console

---

## Quick Commands

### Check if device is connected
```bash
adb devices
```

### Clear all logs
```bash
adb logcat -c
```

### Watch for specific logs
```bash
# Auto-refresh logs
adb logcat | grep "Auto-refreshing"

# All app logs
adb logcat | grep "ReactNativeJS"

# Error logs only
adb logcat *:E
```

### Save logs to file
```bash
adb logcat > android_logs.txt
```

---

## Troubleshooting

### ADB not found
```bash
# Install Android SDK Platform Tools
# On macOS with Homebrew:
brew install android-platform-tools

# Or download from:
# https://developer.android.com/studio/releases/platform-tools
```

### Device not showing
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### No logs appearing
- Make sure your app is running
- Check that console.log statements are in your code
- Try clearing logs: `adb logcat -c`
- Restart the app

---

## Example Output

When auto-refresh is working, you should see logs like:

```
I ReactNativeJS: LibraryPage: Auto-refreshing songs (silent)...
I ReactNativeJS: useSongs: Fetched 5 songs
I ReactNativeJS: SearchPage: Auto-refreshing songs (silent)...
I ReactNativeJS: useSongs: Fetched 5 songs
```

These logs appear every 5 seconds when the app is on Library or Search pages.

