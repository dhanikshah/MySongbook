#!/bin/bash
# Script to build APK locally

echo "🔨 Building APK locally..."
echo ""

# Check if android folder exists
if [ ! -d "android" ]; then
    echo "📦 Generating Android native project..."
    npx expo prebuild --platform android
fi

# Build APK
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ APK built successfully!"
        echo "📍 Location: $(pwd)/$APK_PATH"
        echo ""
        echo "To install on connected device:"
        echo "  adb install $APK_PATH"
        echo ""
        echo "Or transfer to device and install manually"
    else
        echo "❌ APK not found at expected location"
    fi
else
    echo "❌ Build failed"
    exit 1
fi
