const mergePRReg = /^Merge pull request #(\d+) from (.*)$/;

module.exports = Promise.resolve()
  .then(() => require('conventional-changelog-angular'))
  .then((preset) => {
    const oldWhatBump = preset.recommendedBumpOpts.whatBump;
    const newWhatBump = (commits, packageInfo) => {
      const parsedCommits = commits
        // Removes commits that are not pull request merges or breaking change.
        .filter(
          (commit) => mergePRReg.test(commit.header) || commit.footer.includes('BREAKING CHANGE:'),
        )
        // For those, sets the body as the header once the actual pull request title is set as body
        .map((commit) => {
          const [, type, scope, subject] =
            commit.body.match(packageInfo.config.parserOpts.headerPattern) || [];
          return { ...commit, header: commit.body, body: null, type, scope, subject };
        });

      let result = oldWhatBump(parsedCommits, packageInfo);
      if (result.level === 0) {
        result = {
          level: 1,
          reason: "Major bump replaced with minor in order to match React Native's versioning spec",
        };
      }
      return result;
    };

    preset.recommendedBumpOpts.whatBump = newWhatBump;

    return preset;
  });
