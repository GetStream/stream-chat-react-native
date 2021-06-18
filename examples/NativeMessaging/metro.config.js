/* eslint-env node */

const PATH = require('path');
const blacklist = require('metro-config/src/defaults/exclusionList');

const extractExternalModules = require('stream-chat-react-native-core/metro-dev-helpers');

const projectRoot = PATH.resolve(__dirname);

const { alternateRoots, extraNodeModules, moduleBlacklist } = extractExternalModules(projectRoot);

module.exports = {
  resolver: {
    blacklistRE: blacklist(moduleBlacklist),
    extraNodeModules,
    useWatchman: false,
  },
  watchFolders: [projectRoot].concat(alternateRoots),
};
