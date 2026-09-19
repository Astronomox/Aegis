const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  // watch only this folder
  __dirname,
];

// Exclude watcher's next build from metro's file watching
config.resolver.blacklistRE = /aegis-watcher\/.next/;

module.exports = config;