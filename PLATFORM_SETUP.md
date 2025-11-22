# 🚀 Platform-Specific Setup Guide

The app now **automatically detects** the platform and uses the correct API URL. You no longer need to manually update `.env` files!

## ✨ Automatic Platform Detection

The app automatically uses:
- **Web**: `http://localhost:3001`
- **Android Emulator**: `http://10.0.2.2:3001` (auto-detected)
- **iOS Simulator**: `http://localhost:3001` (auto-detected)
- **Physical Android Device**: Requires your computer's IP (see below)

## 📱 Running on Different Platforms

### Web
```bash
npm run web
```
Or:
```bash
npm run dev
# Then press 'w'
```

### Android Emulator
```bash
npm run android
```
Or:
```bash
npm run dev
# Then press 'a'
```

The app will automatically use `http://10.0.2.2:3001` for Android emulator.

### iOS Simulator
```bash
npm run ios
```
Or:
```bash
npm run dev
# Then press 'i'
```

### Physical Android Device

For physical devices, you need to use your computer's IP address:

```bash
npm run android:device
```

This automatically detects your local IP address and uses it.

**Manual method:**
1. Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1` (macOS/Linux)
2. Run: `EXPO_PUBLIC_API_URL=http://YOUR_IP:3001 npm run android`

## 🔧 How It Works

The app uses platform detection in `app/services/api.ts`:

1. **First priority**: Uses `EXPO_PUBLIC_API_URL` from environment if set
2. **Auto-detection**: 
   - Web → `localhost:3001`
   - Android → `10.0.2.2:3001` (emulator)
   - iOS → `localhost:3001` (simulator)

## 📝 Environment Variables (Optional)

You can still override the auto-detection by setting `EXPO_PUBLIC_API_URL` in:
- `.env` file
- Command line: `EXPO_PUBLIC_API_URL=http://... npm run dev`
- npm scripts (already configured)

## 🎯 Quick Reference

| Platform | Command | API URL Used |
|----------|---------|--------------|
| Web | `npm run web` | `localhost:3001` |
| Android Emulator | `npm run android` | `10.0.2.2:3001` (auto) |
| Android Device | `npm run android:device` | `YOUR_IP:3001` (auto) |
| iOS Simulator | `npm run ios` | `localhost:3001` |

## ⚠️ Important Notes

1. **Backend must be running** on `http://localhost:3001` before starting the app
2. **Physical devices** need your computer's IP address (not `localhost` or `10.0.2.2`)
3. **Firewall**: Make sure port 3001 is accessible if using physical devices

## 🐛 Troubleshooting

### App can't connect to backend

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/api/songs
   ```

2. **For Android emulator, test connection:**
   - Open browser in emulator
   - Go to: `http://10.0.2.2:3001/api/songs`

3. **For physical device:**
   - Make sure you're using your computer's IP, not `localhost`
   - Check firewall allows connections on port 3001
   - Ensure device and computer are on same network

### Override auto-detection

If you need to override the auto-detection:
```bash
EXPO_PUBLIC_API_URL=http://custom-url:3001 npm run dev
```

