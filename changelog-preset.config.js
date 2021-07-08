const mergePRReg = /^Merge pull request #(\d+) from (.*)$/;
const semanticReg = /^(\w*)(?:\((.*)\))?: (.*)$/;

const transformCommits = (commits) => {
  return (
    commits
      // Removes commits that are not pull request merges or breaking change.
      .filter(
        (commit) =>
          (mergePRReg.test(commit.header) && semanticReg.test(commit.body)) ||
          (commit.footer && commit.footer.includes('BREAKING CHANGE:')),
      )
      // For those, sets the body as the header once the actual pull request title is set as body
      .map((commit) => {
        if (commit.footer && commit.footer.includes('BREAKING CHANGE:')) {
          return commit;
        }

        const [, type, scope, subject] = commit.body.match(semanticReg) || [];
        return { ...commit, header: commit.body, body: null, type, scope, subject };
      })
  );
};

module.exports = Promise.resolve()
  .then(() => require('conventional-changelog-angular'))
  .then((preset) => {
    const oldWhatBump = preset.recommendedBumpOpts.whatBump;
    const oldTransform = preset.conventionalChangelog.writerOpts.transform;

    const newWhatBump = (commits, packageInfo) => {
      const parsedCommits = transformCommits(commits);

      let result = oldWhatBump(parsedCommits, packageInfo);
      if (result.level === 0) {
        result = {
          level: 1,
          reason: "Major bump replaced with minor in order to match React Native's versioning spec",
        };
      }
      return result;
    };

    const newTransform = (commit, context) => {
      const [parsedCommit] = transformCommits([commit]);
      return oldTransform(parsedCommit || commit, context);
    };

    preset.recommendedBumpOpts.whatBump = newWhatBump;
    preset.conventionalChangelog.writerOpts.transform = newTransform;

    return preset;
  });
