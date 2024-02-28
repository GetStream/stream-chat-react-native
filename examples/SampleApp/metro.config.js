const { getDefaultConfig } = require('@react-native/metro-config');
const { exclusionList, resolveUniqueModule } = require('@rnx-kit/metro-config');
const PATH = require('path');
const packageDir = PATH.resolve(__dirname, '../../package');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// find what all modules need to be unique for the app
const dependencyPackageNames = Object.keys(require('./package.json').dependencies);

const watchFolders = [packageDir];

const uniqueModules = dependencyPackageNames.map((packageName) => {
  const [modulePath, blockPattern] = resolveUniqueModule(packageName, __dirname);
  return {
    packageName, // name of the package
    modulePath, // actual path to the module in the project's node modules
    blockPattern, // paths that match this pattern will be blocked from being resolved
  };
});

// block the other paths for unique modules from being resolved
const blockList = uniqueModules.map(({ blockPattern }) => blockPattern);

// provide the path for the unique modules
const extraNodeModules = uniqueModules.reduce((acc, item) => {
  acc[item.packageName] = item.modulePath;
  return acc;
}, {});

extraNodeModules['stream-chat-react-native'] = PATH.resolve(packageDir, 'native-package');

config.resolver.blockList = exclusionList(blockList);
config.resolver.extraNodeModules = extraNodeModules;
config.watchFolders = [...config.watchFolders, ...watchFolders];

module.exports = config;
