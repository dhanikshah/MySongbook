# 🚀 Quick Start Guide

## Starting the Web App

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

### Step 2: Start Web App (Terminal 2)
```bash
cd /Users/dhanik/my-songbook
npm run web
```

## Troubleshooting Port 8081

If you see "Port 8081 is running this app in another window":

### Quick Fix:
```bash
# Kill all Expo processes
lsof -ti:8081 | xargs kill -9
pkill -f "expo start"

# Then start again
npm run web
```

### Alternative: Use Different Port
```bash
PORT=8082 npm run web
```

## Starting Android App

```bash
# Make sure backend is running first
cd backend && npm run dev

# In another terminal
cd /Users/dhanik/my-songbook
npm run android
```

## All Available Commands

- `npm run web` - Start web app
- `npm run android` - Start Android emulator
- `npm run ios` - Start iOS simulator
- `npm run dev` - Start dev server (press w/a/i when prompted)
- `npm run dev:clear` - Clear cache and start
- `npm run backend` - Start backend server

