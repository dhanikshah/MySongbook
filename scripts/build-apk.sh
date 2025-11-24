#!/bin/bash

# Build APK script that filters out harmless bundle warnings

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building APK...${NC}"

# Set JAVA_HOME
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Fix NO_COLOR warnings by unsetting FORCE_COLOR during build
# (FORCE_COLOR is set by some tools, causing Node.js to warn about NO_COLOR being ignored)
unset FORCE_COLOR

# Run prebuild
echo -e "${YELLOW}Running prebuild...${NC}"
npx expo prebuild --platform android

# Add FileProvider configuration for file sharing
echo -e "${YELLOW}Configuring FileProvider for file sharing...${NC}"
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"
XML_DIR="android/app/src/main/res/xml"

# Create xml directory if it doesn't exist
mkdir -p "$XML_DIR"

# Create file_paths.xml
cat > "$XML_DIR/file_paths.xml" << 'FILEPATHS'
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <files-path name="files" path="." />
    <cache-path name="cache" path="." />
    <external-files-path name="external_files" path="." />
    <external-cache-path name="external_cache" path="." />
    <!-- Add external-path for better compatibility with file managers like Files by Google -->
    <external-path name="external" path="." />
</paths>
FILEPATHS

# Add FileProvider to AndroidManifest if not already present
if ! grep -q "FileProvider" "$MANIFEST_FILE"; then
  # Insert FileProvider before closing </application> tag
  sed -i '' '/<\/application>/i\
    <provider\
      android:name="androidx.core.content.FileProvider"\
      android:authorities="${applicationId}.fileprovider"\
      android:exported="false"\
      android:grantUriPermissions="true">\
      <meta-data\
        android:name="android.support.FILE_PROVIDER_PATHS"\
        android:resource="@xml/file_paths" />\
    </provider>
' "$MANIFEST_FILE"
  echo -e "${GREEN}FileProvider added to AndroidManifest${NC}"
else
  echo -e "${GREEN}FileProvider already configured${NC}"
fi

# Build APK and filter warnings
echo -e "${YELLOW}Building release APK...${NC}"
cd android

# Create a temporary file for build output
TEMP_OUTPUT=$(mktemp)
trap "rm -f $TEMP_OUTPUT" EXIT

# Run build and capture output (unset FORCE_COLOR to prevent NO_COLOR warnings)
FORCE_COLOR= ./gradlew assembleRelease > "$TEMP_OUTPUT" 2>&1
BUILD_EXIT_CODE=$?

# Filter out harmless bundle warnings and print the rest
while IFS= read -r line; do
    # Filter out NO_COLOR warnings
    if [[ "$line" =~ "NO_COLOR" ]] || [[ "$line" =~ "FORCE_COLOR" ]]; then
        continue
    fi
    
    # Filter out specific harmless warnings from bundle analyzer
    if [[ "$line" =~ "warning:" ]]; then
        # Skip all bundle analyzer warnings (they're from third-party libraries checking for web APIs)
        if [[ "$line" =~ "index.android.bundle" ]] || \
           [[ "$line" =~ "was not declared" ]] || \
           [[ "$line" =~ "Direct call to eval" ]] || \
           [[ "$line" =~ "the variable \"" ]] || \
           [[ "$line" =~ "the property \"" ]] || \
           [[ "$line" =~ "^\s+\^" ]]; then
            # Skip this line (harmless warning)
            continue
        fi
    fi
    
    # Filter out transform stderr warnings (NO_COLOR related)
    if [[ "$line" =~ "transform\[stderr\]:" ]] && [[ "$line" =~ "Warning:" ]]; then
        continue
    fi
    
    # Print all other lines (including real errors and important output)
    echo "$line"
done < "$TEMP_OUTPUT"

# Check build result
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    cd ..
    echo -e "${GREEN}APK location: android/app/build/outputs/apk/release/app-release.apk${NC}"
    exit 0
else
    echo -e "${RED}❌ Build failed${NC}"
    cd ..
    exit $BUILD_EXIT_CODE
fi

