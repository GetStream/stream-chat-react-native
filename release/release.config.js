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
          { breaking: true, release: 'minor' },
          { type: 'workspaces', release: 'patch' },
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
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'workspaces', section: 'Workspaces' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
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

  if ((process.env.GH_TOKEN || process.env.GITHUB_TOKEN) && process.env.GIT_BRANCH === 'master') {
    plugins.push([
      '@semantic-release/git',
      {
        assets: [
          `${process.cwd()}/package.json`,
          `${process.cwd()}/yarn.lock.json`,
          `${process.cwd()}/CHANGELOG.md`,
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ]);
  }

  const rootPackage = require('../package.json');

  return {
    extends: [`${__dirname}/monorepo-setup.js`],
    workspaces: rootPackage.workspaces,
    filterRegex: mergeRegex,
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
