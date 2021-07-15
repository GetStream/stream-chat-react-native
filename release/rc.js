const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    branches: ['develop', { name: 'master', channel: 'rc', prerelease: 'rc' }],
  });
});
