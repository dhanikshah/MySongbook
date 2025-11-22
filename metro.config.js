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

module.exports = config;

