/* eslint-env node */
const PATH = require('path');

const { extractExtraNodeModules, findLinkedPackages } = require('./lib');

const sdkBlacklistedPaths = [
  '/native-package/node_modules',
  '/expo-package/node_modules',
  '/node_modules',
];

module.exports = function extractLinkedPackages(repoDir) {
  // Map containing linked packages and their real paths
  const linkedPackages = findLinkedPackages(repoDir);

  const sdkRootPackage = linkedPackages['stream-chat-react-native-core'];
  const sdkNativePackage = linkedPackages['stream-chat-react-native'];
  const sdkExpoPackage = linkedPackages['stream-chat-expo'];
  const streamChatReactNativeDevtools = linkedPackages['stream-chat-react-native-devtools'];

  if (!sdkRootPackage) {
    throw new Error('stream-chat-react-native-core is not linked!');
  }

  const alternateRoots = [sdkRootPackage];

  if (sdkNativePackage) {
    alternateRoots.push(sdkNativePackage);
  }

  if (sdkExpoPackage) {
    alternateRoots.push(sdkExpoPackage);
  }

  if (streamChatReactNativeDevtools) alternateRoots.push(streamChatReactNativeDevtools);

  if (!sdkNativePackage && !sdkExpoPackage) {
    throw new Error(
      'stream-chat-react-native or stream-chat-expo is not linked! You need to link at least one.',
    );
  }

  // Blacklisting samples and other packages folders so theyre not taken in consideration
  // The filter operation checks if this helper is being used inside of one of the blacklisted
  // folders and if so, removes it from the blacklist.
  const moduleBlacklist = sdkBlacklistedPaths
    .filter((item) => repoDir.slice(-item.length) !== item)
    .map((item) => new RegExp(sdkRootPackage + item + '/.*'));

  // Recursively extract node_modules for repoDir and linked packages
  const repoNodeModules = PATH.join(repoDir, 'node_modules');
  const extraNodeModules = extractExtraNodeModules(repoDir, repoNodeModules);

  return { alternateRoots, extraNodeModules, moduleBlacklist };
};
