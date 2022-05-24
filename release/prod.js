const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  const currentPackage = require(`${process.cwd()}/package.json`);
  const isSDK = currentPackage.name === 'stream-chat-react-native-core';

  const newConfig = {
    ...config,
    branches: ['main'],
  };

  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    const commitMessage = 'chore(release): ${nextRelease.version} [skip ci]';

    // This oneliner takes care of commiting and pushing the package.json and
    // changelog.md but only if there is a change on it.
    newConfig.plugins.push([
      '@semantic-release/exec',
      {
        prepareCmd: `git diff-index --quiet HEAD -- ${process.cwd()}/* && exit 0 || (git add ${process.cwd()}/package.json && git add ${process.cwd()}/CHANGELOG.md && git commit -m "${commitMessage}" && git push origin main)`,
      },
    ]);

    newConfig.plugins.push('@semantic-release/git');

    if (isSDK) {
      newConfig.plugins.push('@semantic-release/github');
    }
  }
  return semanticRelease(newConfig);
});
