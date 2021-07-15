const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    branches: [
      'master',
      {
        name: 'semantic-release',
        channel: 'next',
        prerelease: 'next',
      },
    ],
  }).then((result) => {
    return (
      result &&
      result.nextRelease.gitTag &&
      execa('git', ['ls-remote', 'origin', `refs/tags/${result.lastRelease.gitTag}`])
        .then(({ stdout }) => ({
          tagExists: stdout,
          result,
        }))
        .then(({ tagExists, result }) => {
          if (tagExists) {
            return execa('git', ['push', '--delete', 'origin', result.lastRelease.gitTag]);
          }
        })
    );
  });
});
