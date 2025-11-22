# Testing on Real Android Device

## Prerequisites

1. **Android device** with Android 6.0+ (API level 23+)
2. **USB cable** to connect device to computer
3. **Backend server running** on your computer (port 3001)
4. **Same WiFi network** - Device and computer must be on the same network

---

## Step 1: Enable Developer Options on Android Device

1. Go to **Settings** > **About Phone**
2. Find **Build Number** and tap it **7 times**
3. You'll see a message: "You are now a developer!"
4. Go back to **Settings** > **Developer Options**
5. Enable:
   - ✅ **USB Debugging**
   - ✅ **Install via USB** (if available)

---

## Step 2: Connect Device to Computer

### Option A: USB Connection (Recommended)

1. Connect your Android device to your computer via USB cable
2. On your device, you may see a prompt: **"Allow USB debugging?"**
   - Check **"Always allow from this computer"**
   - Tap **"Allow"**

### Verify Connection

```bash
# Check if device is connected
adb devices
```

You should see your device listed, e.g.:
```
List of devices attached
ABC123XYZ    device
```

If you see "unauthorized", tap "Allow" on your device when prompted.

---

## Step 3: Get Your Computer's IP Address

Your Android device needs to connect to your backend server. You need your computer's local IP address.

### Find Your IP Address

**On macOS/Linux:**
```bash
# Get your local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or more specifically:
ipconfig getifaddr en0  # For WiFi
ipconfig getifaddr en1  # For Ethernet
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

You'll get something like: `192.168.1.100` or `10.0.0.5`

---

## Step 4: Start Backend Server

Make sure your backend is running on your computer:

```bash
cd backend
npm run dev
```

The backend should be running on `http://localhost:3001`

---

## Step 5: Configure API URL for Physical Device

Physical Android devices **cannot** use `localhost` or `10.0.2.2`. They need your computer's actual IP address.

### Option A: Set Environment Variable (Recommended)

```bash
# Replace 192.168.1.100 with YOUR computer's IP address
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001 npx expo start
```

### Option B: Use the npm script (if available)

Check if there's a script in `package.json` for physical devices, or create one:

```bash
# In package.json, add:
"android:device": "EXPO_PUBLIC_API_URL=http://YOUR_IP:3001 expo start --android"
```

### Option C: Update .env file (if using one)

Create or update `.env` file:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

Then run:
```bash
npx expo start --android
```

---

## Step 6: Start Expo and Install App

### Method 1: Using Expo Go App (Easiest)

1. **Install Expo Go** on your Android device from Google Play Store
2. Start Expo:
   ```bash
   # With API URL set
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3001 npx expo start
   ```
3. You'll see a QR code in the terminal
4. **On your Android device:**
   - Open **Expo Go** app
   - Tap **"Scan QR code"**
   - Scan the QR code from your terminal
5. The app will load on your device!

### Method 2: Using Development Build

1. Build and install the app directly:
   ```bash
   # With API URL set
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3001 npx expo run:android
   ```
2. This will build and install the app directly on your device
3. The app will appear in your app drawer

---

## Step 7: Verify Connection

1. Open the app on your device
2. Check the console logs - you should see:
   ```
   Detected Android platform, using http://192.168.1.100:3001
   ```
3. Try adding a song - it should work!

---

## Troubleshooting

### Device Not Showing in `adb devices`

1. **Check USB connection:**
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

2. **Try different USB cable** (some cables are charge-only)

3. **Check USB mode on device:**
   - When connected, pull down notification panel
   - Tap "USB" notification
   - Select "File Transfer" or "MTP"

### "Network request failed" or Can't Connect to Backend

1. **Verify IP address is correct:**
   ```bash
   # On your computer, check IP
   ifconfig | grep "inet "
   ```

2. **Verify backend is running:**
   ```bash
   # Test from your computer
   curl http://localhost:3001/health
   ```

3. **Check firewall:**
   - Make sure port 3001 is not blocked
   - On macOS: System Preferences > Security & Privacy > Firewall
   - Temporarily disable firewall to test

4. **Verify same WiFi network:**
   - Device and computer must be on the same network
   - Check WiFi name matches

5. **Test connection from device:**
   - Open browser on device
   - Go to: `http://YOUR_IP:3001/health`
   - Should see: `{"status":"ok"}`

### App Crashes on Launch

1. **Check console logs:**
   ```bash
   adb logcat | grep -E "ReactNativeJS|Expo|Error"
   ```

2. **Clear app data:**
   - Settings > Apps > My Songbook > Clear Data

3. **Reinstall app:**
   ```bash
   npx expo run:android
   ```

### QR Code Not Scanning

1. **Make sure device and computer are on same network**
2. **Try manual connection:**
   - In Expo Go, tap "Enter URL manually"
   - Enter: `exp://YOUR_COMPUTER_IP:8081`

---

## Quick Reference

### Start Backend
```bash
cd backend
npm run dev
```

### Start Expo with Device IP
```bash
# Replace with your IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001 npx expo start
```

### Check Device Connection
```bash
adb devices
```

### View Logs
```bash
adb logcat | grep -E "ReactNativeJS|Expo"
```

### Test Backend from Device Browser
Open on device: `http://YOUR_IP:3001/health`

---

## Tips

1. **Keep backend running** - The app needs the backend server to be running
2. **Same WiFi network** - Device and computer must be on the same network
3. **Use USB for first setup** - Easier to debug connection issues
4. **After first setup, you can use WiFi** - Expo Go can connect wirelessly if on same network
5. **Hot reload works** - Changes in code will automatically reload on device

---

## Alternative: Use Android Emulator

If you prefer not to use a physical device, you can use an Android emulator:

1. **Install Android Studio**
2. **Create an Android Virtual Device (AVD)**
3. **Start emulator**
4. **Run:**
   ```bash
   npx expo run:android
   ```

The emulator uses `10.0.2.2` to access your computer's localhost automatically.

