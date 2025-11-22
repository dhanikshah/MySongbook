# Installing Java JDK for Android Builds

## Quick Install (macOS)

### Option 1: Using Homebrew (Recommended)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java JDK
brew install openjdk@17

# Link Java
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc

# Verify
java -version
```

### Option 2: Using Android Studio (Easiest)

If you have Android Studio installed, it includes Java JDK:

1. **Open Android Studio**
2. Go to **Android Studio > Settings** (or **Preferences** on macOS)
3. **Build, Execution, Deployment > Build Tools > Gradle**
4. Check **Gradle JDK** - it should show a JDK path
5. Copy that path and set JAVA_HOME:

```bash
# Find the JDK path from Android Studio
# Usually something like: /Applications/Android Studio.app/Contents/jbr

# Set JAVA_HOME
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr"
echo 'export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr"' >> ~/.zshrc
source ~/.zshrc

# Verify
java -version
```

### Option 3: Download from Oracle/Adoptium

1. **Download JDK 17:**
   - Visit: https://adoptium.net/
   - Download OpenJDK 17 for macOS
   - Install the .pkg file

2. **Set JAVA_HOME:**
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Verify:**
   ```bash
   java -version
   ```

---

## Verify Installation

After installing, verify Java is working:

```bash
# Check Java version
java -version

# Should show something like:
# openjdk version "17.0.x" 2024-xx-xx
# OpenJDK Runtime Environment (build 17.0.x+x)
# OpenJDK 64-Bit Server VM (build 17.0.x+x, mixed mode, sharing)

# Check JAVA_HOME
echo $JAVA_HOME

# Should show path like:
# /Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home
```

---

## After Installing Java

Once Java is installed, try building again:

```bash
npm run build:apk
```

---

## Troubleshooting

### "Java not found" after installation

1. **Reload your shell:**
   ```bash
   source ~/.zshrc
   # or
   source ~/.bash_profile
   ```

2. **Check JAVA_HOME:**
   ```bash
   echo $JAVA_HOME
   ```

3. **Find Java installation:**
   ```bash
   /usr/libexec/java_home -V
   ```

4. **Set JAVA_HOME manually:**
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

### "Wrong Java version"

Android builds typically need Java 11, 17, or 21. Check version:

```bash
java -version
```

If wrong version, switch:

```bash
# List available versions
/usr/libexec/java_home -V

# Switch to Java 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### "JAVA_HOME not set"

```bash
# Find Java
/usr/libexec/java_home -V

# Set JAVA_HOME (replace with your Java path)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Make permanent
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

---

## Quick Fix Script

Run this to automatically set up Java (if Android Studio is installed):

```bash
# Check if Android Studio Java exists
if [ -d "/Applications/Android Studio.app/Contents/jbr" ]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr"
    echo 'export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr"' >> ~/.zshrc
    echo "✅ Java set to Android Studio's JDK"
    java -version
else
    echo "❌ Android Studio JDK not found. Please install Java manually."
fi
```

