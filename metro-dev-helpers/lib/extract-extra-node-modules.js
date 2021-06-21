/* eslint-env node */

const PATH = require('path');
const FS = require('fs');

function resolvePath(...parts) {
  const thisPath = PATH.resolve.apply(PATH, parts);
  if (!FS.existsSync(thisPath)) {
    return;
  }

  return FS.realpathSync(thisPath);
}

function isExternalModule(repoDir, modulePath) {
  return modulePath.substring(0, repoDir.length) !== repoDir;
}

function listDirectories(repoDir, rootPath, cb) {
  FS.readdirSync(rootPath).forEach((fileName) => {
    if (fileName.charAt(0) === '.') {
      return;
    }

    let fullFileName = PATH.join(rootPath, fileName),
      stats = FS.lstatSync(fullFileName),
      symbolic = false;

    if (stats.isSymbolicLink()) {
      fullFileName = resolvePath(fullFileName);
      if (!fullFileName) {
        return;
      }

      stats = FS.lstatSync(fullFileName);

      symbolic = true;
    }

    if (!stats.isDirectory()) {
      return;
    }

    const external = isExternalModule(repoDir, fullFileName);
    cb({ external, fileName, fullFileName, rootPath, symbolic });
  });
}

function buildFullModuleMap(
  repoDir,
  moduleRoot,
  mainModuleMap,
  externalModuleMap,
  _alreadyVisited,
  _prefix,
) {
  if (!moduleRoot) {
    return;
  }

  const alreadyVisited = _alreadyVisited || {},
    prefix = _prefix;

  // eslint-disable-next-line no-prototype-builtins
  if (alreadyVisited && alreadyVisited.hasOwnProperty(moduleRoot)) {
    return;
  }

  alreadyVisited[moduleRoot] = true;

  listDirectories(repoDir, moduleRoot, ({ external, fileName, fullFileName, symbolic }) => {
    if (symbolic) {
      return buildFullModuleMap(
        repoDir,
        resolvePath(fullFileName, 'node_modules'),
        mainModuleMap,
        externalModuleMap,
        alreadyVisited,
      );
    }

    const moduleMap = external ? externalModuleMap : mainModuleMap,
      moduleName = prefix ? PATH.join(prefix, fileName) : fileName;

    if (fileName.charAt(0) !== '@') {
      moduleMap[moduleName] = fullFileName;
    } else {
      return buildFullModuleMap(
        repoDir,
        fullFileName,
        mainModuleMap,
        externalModuleMap,
        alreadyVisited,
        fileName,
      );
    }
  });
}

module.exports = function extractExtraNodeModules(repoDir, moduleRoot) {
  const moduleMap = {},
    externalModuleMap = {};

  buildFullModuleMap(repoDir, moduleRoot, moduleMap, externalModuleMap);

  // Root project modules take precedence over external modules
  return Object.assign({}, externalModuleMap, moduleMap);
};
