#!/bin/bash
# Quick script to set correct JAVA_HOME for Android Studio

CORRECT_JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

if [ -f "$CORRECT_JAVA_HOME/bin/java" ]; then
    echo "✅ Setting JAVA_HOME to: $CORRECT_JAVA_HOME"
    
    # Remove old JAVA_HOME from .zshrc
    sed -i.bak '/^export JAVA_HOME=/d' ~/.zshrc 2>/dev/null || true
    
    # Add correct JAVA_HOME
    echo "export JAVA_HOME=\"$CORRECT_JAVA_HOME\"" >> ~/.zshrc
    
    # Set for current session
    export JAVA_HOME="$CORRECT_JAVA_HOME"
    
    echo "✅ JAVA_HOME updated!"
    echo ""
    echo "Verifying..."
    "$CORRECT_JAVA_HOME/bin/java" -version 2>&1 | head -3
    echo ""
    echo "📝 Next step:"
    echo "  source ~/.zshrc"
    echo "  npm run build:apk"
else
    echo "❌ Java not found at: $CORRECT_JAVA_HOME"
    echo ""
    echo "Please install Java first:"
    echo "  brew install openjdk@17"
fi
