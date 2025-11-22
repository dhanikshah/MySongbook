# Building and Installing APK on Android Device (Local Build)

## Complete Step-by-Step Guide

### Prerequisites

1. **Android Studio** installed
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API level 23+)
   - Install Java JDK (usually included with Android Studio)

2. **Backend server** - Must be running on your computer
3. **Android device** - Physical device or emulator
4. **Same WiFi network** - Device and computer must be on same network

---

## Step 1: Start Backend Server

**Important:** The backend must be running before building and testing!

```bash
cd backend
npm run dev
```

The backend should be running on `http://localhost:3001`

**Keep this terminal running!**

---

## Step 2: Generate Android Native Project

This creates the `android/` folder with native Android code:

```bash
npx expo prebuild --platform android
```

**Note:** You only need to do this once. If `android/` folder already exists, you can skip this step.

---

## Step 3: Build APK

### Option A: Using npm script (Recommended)

```bash
npm run build:apk
```

This will:
1. Generate Android project (if needed)
2. Build release APK
3. Show you where the APK is located

### Option B: Using helper script

```bash
./build-apk-local.sh
```

### Option C: Manual build

```bash
cd android
./gradlew assembleRelease
```

The APK will be created at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 4: Install APK on Device

### Method 1: Via USB (ADB) - Recommended

1. **Connect device via USB**
2. **Enable USB Debugging** on device:
   - Settings > Developer Options > USB Debugging
3. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed.

4. **Install APK:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

### Method 2: Manual Transfer

1. **Transfer APK to device:**
   - Email it to yourself
   - Use Google Drive / Dropbox
   - Use USB file transfer
   - Or use `adb push`:
     ```bash
     adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/
     ```

2. **On device:**
   - Open **Files** app
   - Navigate to **Downloads**
   - Tap the APK file
   - Tap **Install**

3. **Enable Unknown Sources** (if prompted):
   - Settings > Security > Unknown Sources (enable)
   - Or Settings > Apps > Special Access > Install Unknown Apps
   - Select your file manager and enable

---

## Step 5: Configure Network Connection

### Important: Same WiFi Network Required!

Your Android device and computer must be on the **same WiFi network**.

### Get Your Computer's IP Address

```bash
# Use helper script
./get-device-ip.sh

# Or manually (macOS)
ipconfig getifaddr en0

# Or manually (Linux)
hostname -I
```

You'll get something like: `192.168.1.100`

### API URL is Auto-Configured!

**Good news:** The app automatically detects your server IP! No manual configuration needed.

The app will:
1. Try to get IP from Expo dev server
2. Scan common local network IPs automatically
3. Connect to your backend server

---

## Step 6: Test the App

1. **Open the app** on your device
2. **Check connection:**
   - The app should automatically connect to your backend
   - Try adding a song to verify it works

### Verify Backend is Accessible

Test from your device's browser:
```
http://YOUR_IP:3001/health
```

Should return: `{"status":"ok"}`

---

## Troubleshooting

### Build Fails

**"Gradle build failed"**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

**"Java not found"**
- Make sure Java JDK is installed
- Check: `java -version`

**"Android SDK not found"**
- Open Android Studio
- Tools > SDK Manager
- Install Android SDK Platform 23+

### APK Won't Install

**"Install blocked"**
- Enable "Unknown Sources" in device settings
- Settings > Security > Unknown Sources

**"App not installed"**
- Uninstall existing version first: `adb uninstall com.mysongbook.app`
- Or: `adb install -r app-release.apk` (reinstall)

**"Insufficient storage"**
- Free up space on device

### App Can't Connect to Backend

**"Network request failed"**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check same WiFi network:**
   - Device and computer must be on same network
   - Check WiFi name matches

3. **Test from device browser:**
   ```
   http://YOUR_IP:3001/health
   ```
   Should return: `{"status":"ok"}`

4. **Check firewall:**
   - Make sure port 3001 is not blocked
   - macOS: System Preferences > Security & Privacy > Firewall
   - Temporarily disable to test

5. **View app logs:**
   ```bash
   adb logcat | grep ReactNativeJS
   ```

### App Crashes on Launch

1. **Check logs:**
   ```bash
   adb logcat | grep -E "ReactNativeJS|Error|FATAL"
   ```

2. **Clear app data:**
   ```bash
   adb shell pm clear com.mysongbook.app
   ```

3. **Rebuild and reinstall:**
   ```bash
   npm run build:apk
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Build APK
npm run build:apk

# Install on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Check device connection
adb devices

# View logs
adb logcat | grep ReactNativeJS

# Get your IP
./get-device-ip.sh

# Test backend from device browser
# Open: http://YOUR_IP:3001/health
```

---

## Notes

- **First build takes longer** (5-10 minutes) - subsequent builds are faster
- **APK size:** Usually 20-50 MB
- **Signing:** Release APKs are automatically signed by Gradle
- **Updates:** To update the app, just rebuild and reinstall
- **API URL:** Automatically configured - no manual setup needed!

---

## Success Checklist

- [ ] Backend server is running
- [ ] Android Studio installed
- [ ] `android/` folder exists (from `npx expo prebuild`)
- [ ] APK built successfully
- [ ] Device connected via USB (or APK transferred)
- [ ] Unknown Sources enabled on device
- [ ] APK installed successfully
- [ ] Device and computer on same WiFi
- [ ] Backend accessible from device browser
- [ ] App opens and connects to backend
- [ ] Can add/view songs successfully

---

## Next Steps

Once the APK is installed and working:
- You can distribute it to other devices
- No need for Google Play Store
- Works offline (but needs backend for full functionality)
- Updates: Just rebuild and reinstall

Enjoy your app! 🎉

