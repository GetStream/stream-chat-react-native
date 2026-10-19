const fs = require('fs');

const execa = require('execa');
const semanticRelease = require('semantic-release').default;

const configPromise = require('./release.config.js');

const dryRun = process.env.DRY_RUN === 'true';

// The version is otherwise buried in semantic-release's log, which prints the body of every
// analyzed commit. Repeat it as the last log line and in the run's job summary.
const reportRelease = (result) => {
  const line = result
    ? `${dryRun ? 'Dry run: would publish' : 'Published'} ${result.nextRelease.version} (npm dist-tag \`${result.nextRelease.channel || 'latest'}\`, git tag \`${result.nextRelease.gitTag}\`)`
    : 'No release: no commits since the last release warrant one';
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${line}\n`);
  }
};

configPromise.then((config) => {
  return semanticRelease({
    ...config,
    dryRun,
    branches: [
      'main',
      {
        name: 'develop',
        channel: 'beta',
        prerelease: 'beta',
      },
      {
        name: 'V10',
        channel: 'rc',
        prerelease: 'rc',
      },
    ],
  }).then((result) => {
    reportRelease(result);
    // This logics avoid a overflow of next tags in github by removing the last
    // tag before pushing the current one for each next release
    return (
      !dryRun &&
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
