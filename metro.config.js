const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce file watching to prevent EMFILE errors
config.watchFolders = [];
config.resolver = {
  ...config.resolver,
  // Reduce the number of files to watch
  sourceExts: [...config.resolver.sourceExts],
  // Ensure assets are included
  assetExts: [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'],
};

// Suppress bundle warnings from third-party libraries
// These warnings are harmless - they're from libraries checking for web APIs that don't exist in React Native
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    // Suppress warnings about undeclared variables (these are intentional checks in libraries)
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      ...config.transformer?.minifierConfig?.mangle,
      // Suppress eval warnings (React Native Reanimated uses eval for worklets)
      reserved: ['eval'],
    },
  },
};

module.exports = config;

