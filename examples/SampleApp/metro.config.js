/* eslint-env node */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const PATH = require('path');
const blacklist = require('metro-config/src/defaults/exclusionList');

const extractLinkedPackages = require('stream-chat-react-native-core/metro-dev-helpers/extract-linked-packages');

const projectRoot = PATH.resolve(__dirname);

const { alternateRoots, extraNodeModules, moduleBlacklist } = extractLinkedPackages(projectRoot);

const customConfig = {
  resolver: {
    blacklistRE: blacklist(moduleBlacklist),
    extraNodeModules,
    useWatchman: false,
  },
  watchFolders: [projectRoot].concat(alternateRoots),
};

module.exports = mergeConfig(getDefaultConfig(__dirname), customConfig);
