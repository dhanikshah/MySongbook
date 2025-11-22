#!/bin/bash
# Script to install Java JDK for Android builds

echo "🔧 Installing Java JDK for Android builds..."
echo ""

# Check if Homebrew is installed
if ! command -v brew >/dev/null 2>&1; then
    echo "❌ Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH (for Apple Silicon Macs)
    if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

echo "📦 Installing OpenJDK 17..."
brew install openjdk@17

echo ""
echo "🔗 Setting up Java..."
# Link Java
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk 2>/dev/null || true

# Set JAVA_HOME
JAVA_HOME_PATH='$(/usr/libexec/java_home -v 17)'
if ! grep -q "JAVA_HOME" ~/.zshrc 2>/dev/null; then
    echo "export JAVA_HOME=$JAVA_HOME_PATH" >> ~/.zshrc
    echo "✅ Added JAVA_HOME to ~/.zshrc"
fi

# Set for current session
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/opt/homebrew/opt/openjdk@17")

echo ""
echo "✅ Java installation complete!"
echo ""
echo "Verifying installation..."
java -version 2>&1 | head -3 || echo "⚠️  Java not in PATH yet. Please run: source ~/.zshrc"
echo ""
echo "📝 Next steps:"
echo "  1. Run: source ~/.zshrc"
echo "  2. Verify: java -version"
echo "  3. Try building again: npm run build:apk"
