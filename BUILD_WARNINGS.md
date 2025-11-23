# Build Warnings Explanation

## Overview

The Android build process generates warnings from the JavaScript bundle analyzer. These warnings are **harmless** and do not affect app functionality.

## Warning Categories

### 1. Undeclared Variables (Most Common)
Warnings like:
- `the variable "fetch" was not declared`
- `the variable "document" was not declared`
- `the variable "navigator" was not declared`

**Why they appear:**
- React Native libraries check for web APIs before using them
- Code like `typeof document !== 'undefined'` is intentional
- These checks ensure code works in both web and native environments

**Impact:** None - these are defensive checks

### 2. eval() Usage
Warnings like:
- `Direct call to eval(), but lexical scope is not supported`

**Why they appear:**
- React Native Reanimated uses `eval()` for worklets (animation code)
- This is intentional and required for the library to function
- Worklets need dynamic code evaluation for performance

**Impact:** None - this is expected behavior

### 3. Duplicate Style Properties
Warnings like:
- `the property "backButton" was set multiple times`

**Status:** ✅ **FIXED** - Removed duplicate style definitions in `SongViewerPage.tsx`

## Are These Warnings Safe to Ignore?

**Yes!** These warnings are:
- ✅ From third-party libraries (React Native, Expo, Reanimated)
- ✅ Intentional code patterns (defensive checks, worklets)
- ✅ Do not affect app functionality
- ✅ Do not cause runtime errors
- ✅ Common in React Native projects

## Build Still Succeeds

Despite these warnings, the build completes successfully:
```
BUILD SUCCESSFUL in 22s
694 actionable tasks: 48 executed, 646 up-to-date
```

## If You Want to Suppress Warnings

You can filter warnings during build by modifying the build script:

```bash
npm run build:apk 2>&1 | grep -v "warning:" | grep -v "was not declared"
```

Or create a wrapper script that filters these specific warnings.

## Summary

- ✅ **Fixed:** Duplicate style definitions
- ℹ️ **Harmless:** All other warnings are from third-party libraries
- ✅ **Build succeeds:** Warnings don't prevent successful builds
- ✅ **App works:** No functional impact

