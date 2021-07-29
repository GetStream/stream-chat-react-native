const semanticRelease = require("semantic-release");
const configPromise = require("./release.config.js");

configPromise.then((config) => {
  const currentPackage = require(`${process.cwd()}/package.json`);
  const isSDK = currentPackage.name === "stream-chat-react-native-core";

  const newConfig = {
    ...config,
    branches: ["master"],
  };

  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    const commitMessage = 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}';

    newConfig.plugins.push([
      '@semantic-release/exec',
      {
        prepareCmd: `git diff-index --quiet HEAD -- ${process.cwd()}/* || git add ${process.cwd()}/* && git commit -m "${commitMessage}" && git push origin master`,
      },
    ]);

    newConfig.plugins.push('@semantic-release/git');

    if (isSDK) {
      newConfig.plugins.push('@semantic-release/github');
    }
  }
  return semanticRelease(newConfig);
});
