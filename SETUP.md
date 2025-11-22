# Quick Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Expo CLI** - See installation options below
3. **Android Studio** (for Android builds) - [Download](https://developer.android.com/studio)

### Installing Expo CLI

**Option 1: Use npx (Recommended - No Installation Required)**
```bash
# You can use Expo commands directly with npx
npx expo start
npx expo start --web
```

**Option 2: Install Globally**
```bash
npm install -g expo-cli
```

**If you get permission errors (EACCES):**
```bash
# Configure npm to use a directory in your home folder
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Then install expo-cli
npm install -g expo-cli
```

## Installation Steps

### 1. Install Dependencies

**Prerequisites for Backend:**
- **Xcode Command Line Tools** (required for `better-sqlite3` native compilation)
  ```bash
  xcode-select --install
  ```
  Follow the dialog prompts to install. This may take 10-15 minutes.

```bash
# Frontend
npm install

# Backend (after Xcode tools are installed)
cd backend
npm install
cd ..
```

**Note:** This project uses `--legacy-peer-deps` to resolve React/React Native version conflicts. This is configured automatically via `.npmrc` file. If you encounter dependency resolution errors, the `.npmrc` file should handle it.

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
EXPO_PUBLIC_API_URL=http://localhost:3001
# Optional: For better OCR results
OPENAI_API_KEY=your_key_here
```

### 3. Create Assets Directory

Create placeholder assets (or replace with your own):

```bash
mkdir -p assets
```

You'll need:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (1284x2778)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/favicon.png` (48x48)

### 4. Start Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Then:
- Press `w` for web
- Press `a` for Android emulator
- Press `i` for iOS simulator

## Troubleshooting

### Permission Errors (EACCES) When Installing Global Packages
If you get `EACCES: permission denied` when installing global npm packages:

```bash
# Configure npm to use your home directory
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

Or simply use `npx` instead of global installation (recommended):
```bash
npx expo start  # Instead of: expo start
```

### Port Already in Use
Change `PORT` in `.env` or kill the process using port 3001.

### Database Errors
Delete `backend/db/songbook.db` and restart the backend server.

### Backend Installation Errors

**Error: "tsx: command not found"**
- You need to install backend dependencies first:
  ```bash
  cd backend
  npm install
  ```

**Error: "Could not find any Python installation" or "gyp ERR! find Python"**
- This means Xcode Command Line Tools are not installed
- Install them with:
  ```bash
  xcode-select --install
  ```
- Wait for the installation to complete (10-15 minutes)
- Then retry: `cd backend && npm install`

**Error: "better-sqlite3" build fails or "C++20 or later required"**
- Ensure Xcode Command Line Tools are installed (see above)
- The project uses `better-sqlite3@^11.7.0` which supports Node.js 24+ and C++20
- If you still get C++20 errors, try:
  ```bash
  cd backend
  rm -rf node_modules package-lock.json
  npm install
  ```
- On macOS, you may also need to accept the Xcode license:
  ```bash
  sudo xcodebuild -license accept
  ```

### Dependency Resolution Errors (ERESOLVE)
If you get `ERESOLVE unable to resolve dependency tree` errors:

The project includes an `.npmrc` file that automatically uses `--legacy-peer-deps`. This is necessary because React Native 0.74.0 requires React 18.2.0, while some web dependencies prefer React 18.3.1+. The legacy peer deps flag allows npm to install these packages together safely.

If you still encounter issues:
```bash
npm install --legacy-peer-deps
```

### Frontend "EMFILE: too many open files" Error
If you get `EMFILE: too many open files, watch` when running `npm run dev`:

**Solution 1: Install Watchman (Recommended)**
```bash
brew install watchman
```

**Solution 2: Use the dev script with increased file limit**
The `dev` script now automatically increases the file limit. If you still get errors:
```bash
ulimit -n 4096 && npm run dev
```

**Solution 3: Clear cache and restart**
```bash
rm -rf .expo node_modules/.cache
npm run dev:clear
```

### OCR Not Working
- Ensure Tesseract.js dependencies are installed
- For better results, add OpenAI API key to `.env`

## Next Steps

See [README.md](./README.md) for full documentation.

