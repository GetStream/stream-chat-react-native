const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    branches: [
      'master',
      { name: 'semantic-release', channel: 'next', prerelease: `next.${GITHUB_SHORT_SHA}` },
    ],
  }).then((result) => {
    return execa(`git`, ['push', '--delete', 'origin', result.nextRelease.gitTag]);
  });
});
