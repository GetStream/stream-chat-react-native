const semanticRelease = require('semantic-release').default;
const configPromise = require('./release.config.js');

const execa = require('execa');

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    branches: [
      {
        name: 'main',
        range: "9.x",
      },
      {
        name:"V8-release",
        channel: false,
        range: "8.x",
      },
      {
        name: 'develop',
        channel: 'beta',
        prerelease: 'beta',
      },
    ],
  }).then((result) => {
    // This logics avoid a overflow of next tags in github by removing the last
    // tag before pushing the current one for each next release
    return (
      result &&
      result.nextRelease.gitTag &&
      execa('git', ['ls-remote', 'origin', `refs/tags/${result.lastRelease.gitTag}`])
        .then(({ stdout }) => ({
          tagExists: stdout,
          result,
        }))
        .then(({ tagExists, result }) => {
          if (tagExists && result.lastRelease && result.lastRelease.gitTag.includes('-beta')) {
            return execa('git', ['push', '--delete', 'origin', result.lastRelease.gitTag]);
          }
        })
    );
  });
});
