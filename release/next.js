const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    tagFormat: `${process.env.TAG_FORMAT}.${process.env.GITHUB_SHORT_SHA}`,
    branches: ['master', { name: 'semantic-release', channel: 'next', prerelease: 'next' }],
  }).then((result) => {
    return execa(`git`, ['push', '--delete', 'origin', result.nextRelease.gitTag]);
  });
});
