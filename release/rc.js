const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    branches: ['develop', { name: 'master', channel: 'rc', prerelease: 'rc' }],
  });
});
