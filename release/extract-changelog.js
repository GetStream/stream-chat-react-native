const fs = require('fs');

const semanticRelease = require('semantic-release');
const configPromise = require('./release.config.js');

configPromise.then((config) => {
  const newConfig = {
    ...config,
    // dryRun means no release will actually be made
    dryRun: true,
    ci: false,
    // dryRuns can only run on the main branch, so we override the branches
    // config to make develop the main branch in this run
    branches: ['develop'],
  };

  newConfig.plugins = newConfig.plugins.filter((plugin) => plugin[0] !== '@semantic-release/npm');

  return semanticRelease(newConfig).then((result) => {
    if (result) {
      const { nextRelease } = result;

      // After getting the next release info, we create the NEXT_RELEASE_CHANGELOG
      // file which will later be used in CI to add the comment in the PR with the
      // next release changelog.
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
