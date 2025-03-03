const { getDefaultConfig } = require('@react-native/metro-config');
const { exclusionList, resolveUniqueModule } = require('@rnx-kit/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

const PATH = require('path');
const packageDirPath = PATH.resolve(__dirname, '../../package');
const nativePackageDirPath = PATH.resolve(__dirname, '../../package/native-package');

const symlinked = {
  'stream-chat-react-native': nativePackageDirPath,
  'stream-chat-react-native-core': packageDirPath,
};

// find what all modules need to be unique for the app (mainly react and react-native)
// note: we filter the symlinked modules as they are already unique
// and as they dont follow the workspace pattern the auto-generated path to the module is incorrect
const dependencyPackageNames = Object.keys(require('./package.json').dependencies);

const uniqueModules = dependencyPackageNames.map((packageName) => {
  if (symlinked[packageName]) {
    const modulePath = symlinked[packageName];
    const escapedPackageName = PATH.normalize(packageName).replace(/\\/g, '\\\\');

    // exclude the symlinked package from being resolved from node_modules
    // example: .*\/node_modules\/stream-chat-react-native-core\/.*
    // the above would avoid native-package to resolve core from its own node_modules
    const exclusionRE = new RegExp(
      `.*${PATH.sep}node_modules\\${PATH.sep}${escapedPackageName}\\${PATH.sep}.*`,
    );

    return {
      packageName, // name of the package
      modulePath,
      blockPattern: exclusionRE, // paths that match this pattern will be blocked from being resolved
    };
  }
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

config.resolver.blockList = exclusionList(blockList);
config.resolver.extraNodeModules = extraNodeModules;

config.resolver.nodeModulesPaths = [PATH.resolve(__dirname, 'node_modules')];

// add the package dir for metro to access the package folder
config.watchFolders = [packageDirPath];

module.exports = config;
