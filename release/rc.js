const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  const newConfig = {
    ...config,
    branches: ['develop', { name: 'master', channel: 'rc', prerelease: 'rc' }],
  };

  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    newConfig.plugins.concat([
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
    ]);
  }

  return semanticRelease(newConfig);
});
