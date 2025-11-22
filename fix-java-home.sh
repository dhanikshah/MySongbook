#!/bin/bash
# Script to find and set correct JAVA_HOME

echo "🔍 Finding Java installation..."
echo ""

# Method 1: Check Android Studio
AS_JAVA_PATHS=(
    "/Applications/Android Studio.app/Contents/jbr"
    "/Applications/Android Studio.app/Contents/jre"
    "/Applications/Android Studio.app/jbr"
)

for path in "${AS_JAVA_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/bin/java" ]; then
        echo "✅ Found Java in Android Studio: $path"
        export JAVA_HOME="$path"
        echo "export JAVA_HOME=\"$path\"" >> ~/.zshrc
        echo "✅ JAVA_HOME set to: $path"
        $path/bin/java -version 2>&1 | head -3
        exit 0
    fi
done

# Method 2: Use java_home utility
if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JAVA_PATH=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 11 2>/dev/null || /usr/libexec/java_home 2>/dev/null)
    if [ -n "$JAVA_PATH" ] && [ -d "$JAVA_PATH" ]; then
        echo "✅ Found Java via java_home: $JAVA_PATH"
        export JAVA_HOME="$JAVA_PATH"
        echo "export JAVA_HOME=\"$JAVA_PATH\"" >> ~/.zshrc
        echo "✅ JAVA_HOME set to: $JAVA_PATH"
        java -version 2>&1 | head -3
        exit 0
    fi
fi

# Method 3: Check common locations
COMMON_PATHS=(
    "/Library/Java/JavaVirtualMachines"
    "/opt/homebrew/opt/openjdk@17"
    "/usr/local/opt/openjdk@17"
)

for base in "${COMMON_PATHS[@]}"; do
    if [ -d "$base" ]; then
        for jdk in "$base"/*; do
            if [ -d "$jdk" ] && [ -f "$jdk/Contents/Home/bin/java" ]; then
                JAVA_PATH="$jdk/Contents/Home"
                echo "✅ Found Java: $JAVA_PATH"
                export JAVA_HOME="$JAVA_PATH"
                echo "export JAVA_HOME=\"$JAVA_PATH\"" >> ~/.zshrc
                echo "✅ JAVA_HOME set to: $JAVA_PATH"
                $JAVA_PATH/bin/java -version 2>&1 | head -3
                exit 0
            elif [ -d "$jdk" ] && [ -f "$jdk/bin/java" ]; then
                echo "✅ Found Java: $jdk"
                export JAVA_HOME="$jdk"
                echo "export JAVA_HOME=\"$jdk\"" >> ~/.zshrc
                echo "✅ JAVA_HOME set to: $jdk"
                $jdk/bin/java -version 2>&1 | head -3
                exit 0
            fi
        done
    fi
done

echo "❌ Java not found. Please install Java first."
echo ""
echo "Install with Homebrew:"
echo "  brew install openjdk@17"
echo ""
echo "Or download from:"
echo "  https://adoptium.net/"
exit 1
