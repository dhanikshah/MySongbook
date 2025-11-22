#!/bin/bash
# Script to get local IP address for Android device setup

echo "Finding your local IP address..."
echo ""

# Try different methods to get IP
if command -v ipconfig >/dev/null 2>&1; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
elif command -v hostname >/dev/null 2>&1; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    # Fallback
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
fi

if [ -z "$IP" ]; then
    echo "❌ Could not determine IP address automatically"
    echo ""
    echo "Please find your IP manually:"
    echo "  macOS/Linux: ifconfig | grep 'inet '"
    echo "  Windows: ipconfig"
    exit 1
fi

echo "✅ Your local IP address is: $IP"
echo ""
echo "To start Expo with this IP, run:"
echo "  EXPO_PUBLIC_API_URL=http://$IP:3001 npx expo start"
echo ""
echo "Or add to your .env file:"
echo "  EXPO_PUBLIC_API_URL=http://$IP:3001"
