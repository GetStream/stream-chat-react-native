const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  const newConfig = {
    ...config,
    branches: ['master'],
    dryRun: true,
  };
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    newConfig.plugins.push('@semantic-release/github');
  }
  return semanticRelease(newConfig);
});
