# Building and Installing APK Manually

## Method 1: Using EAS Build (Recommended - Cloud Build)

### Prerequisites
1. **Expo account** (free) - Sign up at https://expo.dev
2. **EAS CLI** installed:
   ```bash
   npm install -g eas-cli
   ```

### Step 1: Login to Expo
```bash
eas login
```

### Step 2: Configure EAS Build
```bash
eas build:configure
```

This creates `eas.json` configuration file.

### Step 3: Build APK
```bash
# Build APK (not AAB)
eas build --platform android --profile preview
```

Or create a preview profile in `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Step 4: Download APK
1. Build will take 10-20 minutes
2. You'll get a download link
3. Download the APK file

### Step 5: Install on Device
1. Transfer APK to your Android device (via USB, email, cloud storage)
2. On device: **Settings > Security > Enable "Unknown Sources"** (or "Install Unknown Apps")
3. Open the APK file
4. Tap "Install"

---

## Method 2: Local Build with Expo (Requires Android Studio)

### Prerequisites
1. **Android Studio** installed
2. **Android SDK** installed (API level 23+)
3. **Java JDK** installed
4. **Backend server running** on your computer (port 3001)

### Step 1: Start Backend Server

**Important:** The backend must be running for the app to work!

```bash
cd backend
npm run dev
```

Keep this terminal running. The backend should be accessible at `http://localhost:3001`

### Step 2: Generate Native Android Project

```bash
npx expo prebuild --platform android
```

This creates an `android/` folder with native Android code.

**Note:** API URL is automatically configured - no manual setup needed!

### Step 3: Build APK Locally

**Option A: Using npm script (Easiest)**
```bash
npm run build:apk
```

**Option B: Using helper script**
```bash
./build-apk-local.sh
```

**Option C: Using Gradle directly**
```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Option D: Using Android Studio**
1. Open Android Studio
2. **File > Open** > Select `android/` folder
3. Wait for Gradle sync
4. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
5. Wait for build to complete
6. Click "locate" link to find APK

### Step 4: Install APK on Device

**Via USB (Recommended):**
```bash
# Connect device via USB
adb devices  # Verify device is connected

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Or Manual Transfer:**
1. Transfer APK to device (email, USB file transfer, cloud storage)
2. On device: **Settings > Security > Enable "Unknown Sources"**
3. Open APK file and tap **Install**

### Step 5: Configure Device Network

**Important:** Your Android device and computer must be on the **same WiFi network**!

1. **Get your computer's IP address:**
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Linux
   hostname -I
   
   # Or use the helper script
   ./get-device-ip.sh
   ```

2. **The app will automatically detect the server IP**, but if it doesn't:
   - Make sure backend is running on your computer
   - Verify device and computer are on same WiFi
   - Check firewall allows port 3001

### Step 6: Test the App

1. Open the app on your device
2. The app will automatically connect to your backend server
3. Try adding a song to verify connection works

**Troubleshooting Connection:**
- If connection fails, check console logs: `adb logcat | grep ReactNativeJS`
- Verify backend is running: `curl http://localhost:3001/health`
- Test from device browser: `http://YOUR_IP:3001/health`

---

## Method 3: Development Build APK (Quick Testing)

### Build Development APK
```bash
# This creates a development build APK
npx expo run:android --variant release
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Note:** This requires `npx expo prebuild` first to generate the `android/` folder.

---

## Method 4: Using Expo Build (Legacy - May Not Work)

```bash
# Install Expo CLI
npm install -g expo-cli

# Build APK
expo build:android -t apk
```

**Note:** This method is deprecated but might still work for some projects.

---

## API URL Configuration (Automated!)

**Good News:** API URL configuration is now **fully automated**! 🎉

The app automatically detects:
- **Web:** Uses `localhost:3001`
- **Android Emulator:** Uses `10.0.2.2:3001`
- **Physical Android Device:** Auto-detects your computer's IP
- **iOS Simulator:** Uses `localhost:3001`

### For Production APK

The app includes **runtime auto-detection** that will:
1. Try to get IP from Expo dev server (if available)
2. Scan common local network IPs (192.168.1.x, 192.168.0.x, 10.0.0.x)
3. Automatically connect to your backend server

**No manual configuration needed!**

### Optional: Hardcode for Specific Network

If you want to hardcode the IP for a specific network, you can:

**Option 1: Environment Variable (Build Time)**
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001 npm run build:apk
```

**Option 2: Update app.json**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_SERVER_IP:3001"
    }
  }
}
```

But in most cases, the automatic detection will work perfectly!

---

## Installing APK on Device

### Via USB (ADB)

1. **Connect device via USB**
2. **Enable USB Debugging** (Settings > Developer Options)
3. **Install APK:**
   ```bash
   adb install path/to/app-release.apk
   ```

### Via File Transfer

1. **Transfer APK to device:**
   - Email it to yourself
   - Use Google Drive / Dropbox
   - Use USB file transfer
   - Use `adb push`:
     ```bash
     adb push app-release.apk /sdcard/Download/
     ```

2. **On device:**
   - Open **Files** app
   - Navigate to **Downloads**
   - Tap the APK file
   - Tap **Install**

### Enable Unknown Sources

Before installing, enable installation from unknown sources:

**Android 8.0+:**
- Settings > Apps > Special Access > Install Unknown Apps
- Select your file manager or browser
- Enable "Allow from this source"

**Older Android:**
- Settings > Security > Unknown Sources (enable)

---

## Quick Reference

### Build APK with EAS (Cloud)
```bash
npm run build:apk:eas
# or
eas build --platform android --profile preview
```

### Build APK Locally
```bash
# Easiest method
npm run build:apk

# Or use helper script
./build-apk-local.sh

# Or manual steps
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

### Install via ADB
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Find APK Location
```bash
# After local build
ls -la android/app/build/outputs/apk/release/
```

### Get Your IP Address
```bash
# Use helper script
./get-device-ip.sh

# Or manually
ipconfig getifaddr en0  # macOS
hostname -I            # Linux
```

---

## Troubleshooting

### "Gradle build failed"
- Make sure Android Studio is installed
- Check Java JDK is installed: `java -version`
- Try: `cd android && ./gradlew clean`

### "APK not installing"
- Enable "Unknown Sources" in device settings
- Check if device has enough storage
- Try: `adb install -r app-release.apk` (reinstall)

### "App crashes on launch"
- Check API URL is correct
- Make sure backend server is accessible from device
- Check logs: `adb logcat | grep ReactNativeJS`

### "Build takes too long"
- EAS builds take 10-20 minutes (cloud build)
- Local builds are faster but require Android Studio setup

---

## Recommended Approach

**For Testing:**
- Use **Method 3** (Development Build) - fastest for testing
- Or use **Expo Go** app for quick iteration

**For Distribution:**
- Use **Method 1** (EAS Build) - easiest, no local setup needed
- Or **Method 2** (Local Build) - more control, requires Android Studio

---

## Notes

- **APK vs AAB:** APK is for direct installation, AAB is for Google Play Store
- **Debug vs Release:** Release builds are optimized and smaller
- **Signing:** Release APKs need to be signed (handled automatically by EAS/Gradle)
- **API URL:** Make sure to configure the correct backend URL for production

