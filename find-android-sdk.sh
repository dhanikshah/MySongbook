#!/bin/bash
# Find Android SDK location

SDK_PATHS=(
    "$HOME/Library/Android/sdk"
    "$HOME/Android/Sdk"
    "/Users/$USER/Library/Android/sdk"
    "$ANDROID_HOME"
    "$ANDROID_SDK_ROOT"
)

for path in "${SDK_PATHS[@]}"; do
    if [ -d "$path" ] && [ -d "$path/platforms" ]; then
        echo "$path"
        exit 0
    fi
done

# Try to find via Android Studio
if [ -d "/Applications/Android Studio.app" ]; then
    AS_SDK=$(defaults read "/Applications/Android Studio.app/Contents/Info.plist" 2>/dev/null | grep -i sdk || echo "")
    if [ -n "$AS_SDK" ]; then
        echo "$AS_SDK"
        exit 0
    fi
fi

echo "NOT_FOUND"
