const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    dryRun: true,
    branches: [
      'master',
      { name: 'develop', channel: 'next', prerelease: `next.${GITHUB_SHORT_SHA}` },
    ],
  }).then((result) => {
    // Maybe this breaks releases because without a tag semantic-release cant keep track of whats already deployed
    // talk to vish
    return execa(`git`, ['push', '--delete', 'origin', result.nextRelease.gitTag]);
  });
});
