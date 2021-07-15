const fs = require('fs');

const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  const newConfig = {
    ...config,
    dryRun: true,
    ci: false,
    branches: ['master', { name: 'develop', channel: 'rc', prerelease: 'rc' }],
  };

  newConfig.plugins = newConfig.plugins.filter((plugin) => plugin[0] !== '@semantic-release/npm');

  return semanticRelease(newConfig).then((result) => {
    if (result) {
      const { nextRelease } = result;

      fs.appendFile(
        `${__dirname}/../NEXT_RELEASE_CHANGELOG.md`,
        `## ${nextRelease.gitTag}\n\n${nextRelease.notes}`,
        function (err) {
          if (err) throw err;
          console.log('Saved!');
        },
      );
    }
  });
});
