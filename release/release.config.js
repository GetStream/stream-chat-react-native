const mergeRegex = /^Merge pull request #(.+) from (.*)/;

module.exports = Promise.resolve().then(() => {
  const currentPackage = require(`${process.cwd()}/package.json`);
  const isSDK = currentPackage.name === 'stream-chat-react-native-core';

  const plugins = [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'chore', release: 'patch' },
          { type: 'refactor', release: 'patch' },
        ],
        parserOpts: {
          mergePattern: mergeRegex,
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        parserOpts: {
          mergePattern: mergeRegex,
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
        presetConfig: {
          types: [
            {
              type: 'fix',
              section: 'Bug Fixes',
              hidden: false,
            },
            {
              type: 'feat',
              section: 'Features',
              hidden: false,
            },
            {
              type: 'chore',
              scope: 'deps',
              section: 'Chores',
              hidden: false,
            },
            {
              type: 'refactor',
              section: 'Refactors',
              hidden: false,
            },
            {
              type: 'perf',
              section: 'Performance Improvements',
              hidden: false,
            },
            {
              type: 'revert',
              section: 'Reverts',
              hidden: false,
            },
          ],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogTitle: '# Change Log',
        changelogFile: `${process.cwd()}/CHANGELOG.md`,
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: isSDK,
      },
    ],
  ];

  const lernaPackage = require('../lerna.json');

  return {
    extends: [`${__dirname}/monorepo-setup.js`],
    workspaces: lernaPackage.packages,
    filterPath: process.env.FILTER_PATH,
    tagFormat: process.env.TAG_FORMAT,
    parseLinkedPackages: (item) => {
      if (item.name === 'stream-chat-react-native-core') {
        return {
          name: 'stream-chat-react-native',
          path: item.path,
        };
      }
      return item;
    },
    plugins,
  };
});
