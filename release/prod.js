const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  const currentPackage = require(`${process.cwd()}/package.json`);
  const isSDK = currentPackage.name === 'stream-chat-react-native-core';

  const newConfig = {
    ...config,
    branches: ['master'],
  };
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    newConfig.plugins.push(
      plugins.push([
        '@semantic-release/git',
        {
          assets: [
            `${process.cwd()}/package.json`,
            `${process.cwd()}/yarn.lock`,
            `${process.cwd()}/CHANGELOG.md`,
          ],
          message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        },
      ]),
    );

    if (isSDK) {
      plugins.push('@semantic-release/github');
    } else {
      plugins.push([
        '@semantic-release/github',
        {
          successComment:
            ':tada: This PR is included on [<%- nextRelease.gitTag %>](https://github.com/semantic-release/github/releases/tag/<%- nextRelease.gitTag %>)',
        },
      ]);
    }
  }
  return semanticRelease(newConfig);
});
