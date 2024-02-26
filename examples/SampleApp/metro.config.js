/* eslint-env node */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolveUniqueModule } = require('@rnx-kit/metro-config');
const PATH = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const packageDir = PATH.resolve(__dirname, '../../package');

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

const customConfig = {
  resolver: {
    blockList: exclusionList(blockList),
    extraNodeModules,
  },
  watchFolders,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), customConfig);
