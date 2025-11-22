# 🎵 My Songbook – Cross-Platform Lyrics/Chords App

A beautiful cross-platform application for managing your song library with OCR text extraction, chord transposition, and powerful search capabilities.

## ✨ Features

- 📱 **Cross-Platform**: Works on Web, Android, and iOS
- 📄 **File Upload & OCR**: Upload PDFs, images, DOCX, or TXT files and extract text automatically
- 🎹 **Chord Transposition**: Transpose chords up or down by semitones while preserving formatting
- 🔍 **Advanced Search**: Search by title, artist, key, type, or tags
- 🏷️ **Tagging System**: Organize songs with custom tags
- 🌓 **Dark Mode**: Beautiful light and dark themes
- 📊 **Song Library**: Browse and manage your entire song collection

## 🛠️ Tech Stack

### Frontend
- **Expo** (React Native) with React Native Web
- **TypeScript**
- **Tailwind CSS** (via NativeWind)
- **React Navigation**

### Backend
- **Node.js** with Express
- **SQLite** (better-sqlite3) for database
- **Tesseract.js** for OCR (with optional OpenAI Vision API)
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI (install globally with `npm install -g expo-cli` or use `npx expo`)
- **Xcode Command Line Tools** (required for backend - install with `xcode-select --install`)
- For Android builds: Android Studio and Android SDK
- (Optional) OpenAI API key for enhanced OCR

**Note:** If you encounter permission errors when installing Expo CLI globally, see the [Troubleshooting](#-troubleshooting) section below.

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd my-songbook

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3001
EXPO_PUBLIC_API_URL=http://localhost:3001
# Optional: Add OpenAI API key for better OCR
OPENAI_API_KEY=your_key_here
```

### 3. Initialize Database

The database will be automatically created when you start the backend server.

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator

## 📱 Building for Android

### Using Expo Application Services (EAS)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build Android APK:
```bash
eas build --platform android --profile preview
```

Or build AAB for Play Store:
```bash
eas build --platform android --profile production
```

### Using Expo CLI (Local Build)

```bash
expo build:android
```

## 🏗️ Project Structure

```
my-songbook/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── SongCard.tsx
│   │   ├── TagSelector.tsx
│   │   ├── ChordTextView.tsx
│   │   ├── FileUploader.tsx
│   │   └── TransposeControls.tsx
│   ├── screens/             # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── AddSongScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SongViewerScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useSongs.ts
│   │   ├── useSearch.ts
│   │   └── useTranspose.ts
│   ├── utils/               # Utility functions
│   │   ├── chordTranspose.ts
│   │   ├── chordParser.ts
│   │   ├── textFormatter.ts
│   │   └── ocr.ts
│   ├── services/            # API services
│   │   └── api.ts
│   └── types/               # TypeScript types
│       └── Song.ts
├── backend/
│   ├── routes/              # API routes
│   │   └── songs.ts
│   ├── services/            # Business logic
│   │   ├── ocrService.ts
│   │   └── storageService.ts
│   ├── db/                  # Database
│   │   └── database.ts
│   └── index.ts             # Express server
├── App.tsx                  # Main app entry
└── package.json
```

## 🎯 API Endpoints

### Songs

- `GET /api/songs` - Get all songs (supports query params: `search`, `type`, `key`, `tags`)
- `GET /api/songs/:id` - Get song by ID
- `POST /api/songs` - Create new song
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song
- `POST /api/songs/upload` - Upload file and extract text

## 🧪 Testing

### Test Cases Covered

1. **File Upload & OCR**
   - Upload PDF → extract text
   - Upload image → OCR extraction
   - Upload DOCX → extract text
   - Upload TXT → read directly

2. **Chord Transposition**
   - Simple chords (C, G, D)
   - Minor chords (Em, Am)
   - Slash chords (D/F#, C/E)
   - Complex chords (Bbmaj7, G#dim, Cadd9)

3. **Search & Filter**
   - Search by title/artist
   - Filter by type
   - Filter by key
   - Filter by tags (AND combination)

4. **Formatting**
   - Line breaks preserved
   - Spacing preserved
   - Chord alignment maintained

## 🎨 UI Components

### SongCard
Displays song preview with title, artist, key, type, and tags.

### TagSelector
Multi-select tag input with suggestions and chip display.

### ChordTextView
Monospaced text viewer for chord/lyric display with zoom controls.

### FileUploader
Handles file selection (documents and images) and triggers OCR.

### TransposeControls
Buttons for transposing chords up/down with step counter.

## 🔧 Configuration

### OCR Options

The app supports two OCR methods:

1. **Tesseract.js** (default) - Free, client-side OCR
2. **OpenAI Vision API** (optional) - More accurate, requires API key

Set `OPENAI_API_KEY` in `.env` to use OpenAI Vision API.

### Database

SQLite database is stored at `backend/db/songbook.db`. The database is automatically initialized on first run.

## 📝 Usage Examples

### Adding a Song

1. Navigate to "Add Song"
2. Upload a file (PDF, image, DOCX, or TXT) or paste text manually
3. Fill in metadata (title, artist, key, type, tags)
4. Review and edit extracted text
5. Save

### Transposing Chords

1. Open a song in the viewer
2. Use the `+` and `−` buttons to transpose up/down
3. The transpose step counter shows current offset
4. Click `0` to reset to original key

### Searching

1. Go to Library
2. Use search bar for text search
3. Use filter buttons for type/key filters
4. Results update in real-time

## 🐛 Troubleshooting

### Permission errors (EACCES) when installing Expo CLI
If you get `EACCES: permission denied` when running `npm install -g expo-cli`:

**Solution 1: Configure npm to use your home directory**
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g expo-cli
```

**Solution 2: Use npx instead (Recommended)**
```bash
# No installation needed - use npx directly
npx expo start
npx expo start --web
```

### Dependency Resolution Errors (ERESOLVE)
If you get `ERESOLVE unable to resolve dependency tree` errors:

The project includes an `.npmrc` file that automatically uses `--legacy-peer-deps`. This is necessary because React Native 0.74.0 requires React 18.2.0, while some web dependencies prefer React 18.3.1+. The legacy peer deps flag allows npm to install these packages together safely.

If you still encounter issues:
```bash
npm install --legacy-peer-deps
```

### Backend Installation Issues

**"tsx: command not found" or "Could not find any Python installation"**
- Install Xcode Command Line Tools first:
  ```bash
  xcode-select --install
  ```
- Wait for installation to complete (10-15 minutes)
- Then install backend dependencies:
  ```bash
  cd backend
  npm install
  ```

**"better-sqlite3" build fails or "C++20 or later required"**
- The project uses `better-sqlite3@^11.7.0` which supports Node.js 24+ and C++20
- Ensure Xcode Command Line Tools are installed
- If you still get errors, try a clean install:
  ```bash
  cd backend
  rm -rf node_modules package-lock.json
  npm install
  ```
- Accept Xcode license if needed:
  ```bash
  sudo xcodebuild -license accept
  ```

### Backend won't start
- Check if port 3001 is available
- Ensure all dependencies are installed
- Check database file permissions

### OCR not working
- For images: Ensure Tesseract.js is properly installed
- For better results: Add OpenAI API key
- Check file format is supported

### Frontend "EMFILE: too many open files" Error
If you get `EMFILE: too many open files, watch` when running `npm run dev`:

**Solution 1: Install Watchman (Recommended)**
```bash
brew install watchman
```

**Solution 2: Use increased file limit**
```bash
ulimit -n 4096 && npm run dev
```

**Solution 3: Clear cache**
```bash
rm -rf .expo node_modules/.cache
npm run dev:clear
```

### Android build fails
- Ensure Android SDK is properly configured
- Check EAS credentials are set up
- Review build logs for specific errors

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Expo, React Native, and Node.js**

