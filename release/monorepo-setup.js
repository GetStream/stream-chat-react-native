const execa = require('execa');
const path = require('path');

const rootPath = path.resolve(`${__dirname}/..`);

const git = async (args, options = {}) => {
  const { stdout } = await execa(`git`, args, options);
  return stdout;
};

const revertRegexSubject = new RegExp('^Revert "(.*)"');
const revertRegexBody = new RegExp('This reverts commit ([a-z0-9]*)');

async function filterCommits(path, regex, pluginConfig, commits) {
  const revertedCommits = commits
    .filter((commit) => {
      return revertRegexSubject.test(commit.subject);
    })
    .map((commit) => {
      const [_, reverted] = commit.body.match(revertRegexBody);
      return reverted;
    });

  const mergeCommits = commits.filter((commit) => {
    if (revertedCommits.includes(commit.hash)) return false;
    const regexPassed = regex ? regex.test(commit.subject) : true;
    const noteKeywordsPassed = pluginConfig.parserOpts.noteKeywords.find(
      (keyword) => commit.body && commit.body.includes(keyword),
    );
    return regexPassed || noteKeywordsPassed;
  });

  const flaggedCommits = await Promise.all(
    mergeCommits.map(async (commit) => {
      const getCommitPaths = await git([
        'log',
        '--name-only',
        '--pretty=format:',
        `${commit.hash}^..${commit.hash}`,
      ]);

      const pathsArr = getCommitPaths.split('\n');

      return {
        commit,
        affectsDir: pathsArr.find((commitPath) => commitPath.slice(0, path.length) === path),
      };
    }),
  );

  const dirCommits = flaggedCommits
    .filter(({ affectsDir }) => {
      return affectsDir;
    })
    .map(({ commit }) => commit);

  return dirCommits;
}

function extractPluginConfig(context, pluginNameParam, stepName) {
  const {
    options: { plugins },
  } = context;

  const pluginIndex = plugins.findIndex((plugin) => plugin[0] === pluginNameParam);

  const pluginDefinition = plugins[pluginIndex];
  const [pluginName, pluginConfig] = Array.isArray(pluginDefinition)
    ? pluginDefinition
    : [pluginDefinition, {}];

  const plugin = require(pluginName);
  const step = plugin && plugin[stepName];

  return [step, pluginConfig];
}

async function extractSymlinkedPackages(globalConfig) {
  const json = require(`${process.cwd()}/package.json`);
  const dependencies = { ...json.dependencies, ...json.devDependencies };
  const manualLinkedPackages = Object.entries(dependencies)
    .filter(([_, value]) => value.includes('link:'))
    .map(([key, value]) => {
      const absolutePath = path.resolve(value.replace('link:', ''));
      return { name: key, path: absolutePath.replace(`${rootPath}/`, '') };
    })
    .filter((item) => globalConfig.workspaces.includes(item.path));

  const { stdout } = await execa('find', [
    `${process.cwd()}/node_modules`,
    '-type',
    'l',
    '-maxdepth',
    '1',
  ]);

  const workspacesPaths = globalConfig.workspaces.map((item) => {
    const json = require(`${rootPath}/${item}/package.json`);
    return { name: json.name, path: item };
  });

  const symlinkedPackages = stdout
    .split('\n')
    .map((item) => workspacesPaths.find((workspace) => workspace.name === item.split('/').pop()))
    .filter((item) => item);

  const linkedWorkspacePackages = manualLinkedPackages;

  symlinkedPackages.forEach((linkedPackage) => {
    if (!linkedWorkspacePackages.find((item) => item.name === linkedPackage.name)) {
      linkedWorkspacePackages.push(linkedPackage);
    }
  });

  return linkedWorkspacePackages.map(globalConfig.parseLinkedPackages);
}

async function extractSymlinkedBumpCommit(
  globalConfig,
  symLinkedPackages,
  context,
  [step, pluginConfig],
) {
  const packagesBumps = await Promise.all(
    symLinkedPackages.map(async (linkedPackage) => {
      const packageCommits = await filterCommits(
        linkedPackage.path,
        globalConfig.filterRegex,
        pluginConfig,
        context.commits,
      );
      const semanticBump = await step(pluginConfig, { ...context, commits: packageCommits });
      return { name: linkedPackage.name, semanticBump };
    }),
  );

  const filteredPackagesBumps = packagesBumps.filter((item) => item.semanticBump);

  if (filteredPackagesBumps.length) {
    const subject = `workspaces: Following linked packages updated: [${filteredPackagesBumps
      .map((item) => item.name)
      .join(', ')}]`;
    return {
      subject,
      message: subject,
    };
  }
}

async function analyzeCommits(globalConfig, context) {
  const { filterPath, filterRegex } = globalConfig;

  const [step, pluginConfig] = extractPluginConfig(
    context,
    '@semantic-release/commit-analyzer',
    'analyzeCommits',
  );

  const filteredCommits = await filterCommits(
    filterPath,
    filterRegex,
    pluginConfig,
    context.commits,
  );

  const symLinkedPackages = await extractSymlinkedPackages(globalConfig);

  if (symLinkedPackages.length) {
    const symlinkedBumpCommit = await extractSymlinkedBumpCommit(
      globalConfig,
      symLinkedPackages,
      context,
      [step, pluginConfig],
    );
    if (symlinkedBumpCommit) {
      filteredCommits.push(symlinkedBumpCommit);
    }
  }
  context.commits = filteredCommits;

  return step(pluginConfig, context);
}

async function generateNotes(globalConfig, context) {
  const { filterPath, filterRegex } = globalConfig;

  const [step, pluginConfig] = extractPluginConfig(
    context,
    '@semantic-release/release-notes-generator',
    'generateNotes',
  );

  const filteredCommits = await filterCommits(
    filterPath,
    filterRegex,
    pluginConfig,
    context.commits,
  );

  const symLinkedPackages = await extractSymlinkedPackages(globalConfig);

  if (symLinkedPackages.length) {
    const symlinkedBumpCommit = await extractSymlinkedBumpCommit(
      globalConfig,
      symLinkedPackages,
      context,
      [step, pluginConfig],
    );
    if (symlinkedBumpCommit) {
      filteredCommits.push(symlinkedBumpCommit);
    }
  }
  context.commits = filteredCommits;

  return step(pluginConfig, context);
}

module.exports = { analyzeCommits, generateNotes };
