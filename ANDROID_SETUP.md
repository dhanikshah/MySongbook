# 📱 Running on Android Emulator

## Prerequisites

1. **Android Studio** installed with Android SDK
2. **Android Emulator** created and running
3. **Backend server** running (see below)

## Step-by-Step Instructions

### 1. Start the Backend Server

In Terminal 1:
```bash
cd /Users/dhanik/my-songbook/backend
npm run dev
```

The backend should be running on `http://localhost:3001`

### 2. Configure API URL for Android

**Important:** Android emulator cannot access `localhost` directly. You need to use `10.0.2.2` which is the special IP that Android emulator uses to access your host machine's localhost.

**Option A: Using Environment Variable (Recommended)**

Create or update `.env` file in the root directory:
```bash
cd /Users/dhanik/my-songbook
```

Create `.env` file:
```env
PORT=3001
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

**Option B: Using Your Computer's IP Address**

Find your computer's local IP address:
- **macOS/Linux:** Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** Run `ipconfig` and look for IPv4 Address

Then set in `.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3001
```

### 3. Start Android Emulator

1. Open **Android Studio**
2. Go to **Tools > Device Manager** (or **AVD Manager**)
3. Start an emulator (or create one if you don't have any)
4. Wait for the emulator to fully boot

### 4. Start Expo and Run on Android

In Terminal 2 (new terminal):
```bash
cd /Users/dhanik/my-songbook
npm run android
```

Or use the general dev command:
```bash
npm run dev
```
Then press `a` when prompted to open on Android.

### 5. Alternative: Manual Connection

If the automatic connection doesn't work:

1. Start Expo dev server:
   ```bash
   npm run dev
   ```

2. You'll see a QR code and connection options

3. In the Android emulator:
   - Open the Expo Go app (install from Play Store if needed)
   - Scan the QR code, OR
   - Type the connection URL manually (shown in terminal)

## Troubleshooting

### Backend Connection Issues

**Problem:** App can't connect to backend

**Solution:** 
- Make sure backend is running on `http://localhost:3001`
- Use `10.0.2.2:3001` in `.env` for Android emulator
- Check that the emulator can access the internet

**Test backend connection from emulator:**
```bash
# In Android emulator, open browser and go to:
http://10.0.2.2:3001/api/songs
```

### Port Already in Use

**Problem:** Port 3001 is already in use

**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change the port in backend/.env
PORT=3002
```

### Expo Not Detecting Android Emulator

**Problem:** Expo doesn't automatically open on Android

**Solution:**
1. Make sure emulator is fully booted (not just starting)
2. Check that `adb` (Android Debug Bridge) is in your PATH
3. Try manually: `adb devices` should show your emulator
4. Restart Expo: `npm run dev` and press `a`

### Network Issues

**Problem:** Can't connect to backend from emulator

**Solutions:**
1. **Use 10.0.2.2 for Android emulator:**
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
   ```

2. **Or use your computer's local IP:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
   ```

3. **Check firewall:** Make sure your firewall allows connections on port 3001

## Quick Start Commands

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend and open on Android
cd /Users/dhanik/my-songbook
npm run android
```

## Notes

- **10.0.2.2** is the special IP address that Android emulator uses to access `localhost` on your host machine
- For **physical Android device**, use your computer's local IP address instead
- Make sure both backend and frontend are running before testing the app

