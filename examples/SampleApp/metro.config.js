/* eslint-disable */
function resolvePath(...parts) {
  const thisPath = PATH.resolve.apply(PATH, parts);
  if (!FS.existsSync(thisPath)) return;

  return FS.realpathSync(thisPath);
}

function isExternalModule(modulePath) {
  return modulePath.substring(0, __dirname.length) !== __dirname;
}

function listDirectories(rootPath, cb) {
  FS.readdirSync(rootPath).forEach(fileName => {
    if (fileName.charAt(0) === '.') return;

    let fullFileName = PATH.join(rootPath, fileName),
      stats = FS.lstatSync(fullFileName),
      symbolic = false;

    if (stats.isSymbolicLink()) {
      fullFileName = resolvePath(fullFileName);
      if (!fullFileName) return;

      stats = FS.lstatSync(fullFileName);

      symbolic = true;
    }

    if (!stats.isDirectory()) return;

    const external = isExternalModule(fullFileName);
    cb({ rootPath, symbolic, external, fullFileName, fileName });
  });
}

function buildFullModuleMap(
  moduleRoot,
  mainModuleMap,
  externalModuleMap,
  _alreadyVisited,
  _prefix,
) {
  if (!moduleRoot) return;

  const alreadyVisited = _alreadyVisited || {},
    prefix = _prefix;

  if (alreadyVisited && alreadyVisited.hasOwnProperty(moduleRoot)) return;

  alreadyVisited[moduleRoot] = true;

  listDirectories(
    moduleRoot,
    ({ external, fileName, fullFileName, symbolic }) => {
      if (symbolic)
        return buildFullModuleMap(
          resolvePath(fullFileName, 'node_modules'),
          mainModuleMap,
          externalModuleMap,
          alreadyVisited,
        );

      const moduleMap = external ? externalModuleMap : mainModuleMap,
        moduleName = prefix ? PATH.join(prefix, fileName) : fileName;

      if (fileName.charAt(0) !== '@') moduleMap[moduleName] = fullFileName;
      else
        return buildFullModuleMap(
          fullFileName,
          mainModuleMap,
          externalModuleMap,
          alreadyVisited,
          fileName,
        );
    },
  );
}

function buildModuleResolutionMap() {
  const moduleMap = {},
    externalModuleMap = {};

  buildFullModuleMap(baseModulePath, moduleMap, externalModuleMap);

  // Root project modules take precedence over external modules
  return Object.assign({}, externalModuleMap, moduleMap);
}

function findAlternateRoots(
  moduleRoot = baseModulePath,
  alternateRoots = [],
  _alreadyVisited,
) {
  const alreadyVisited = _alreadyVisited || {};
  if (alreadyVisited && alreadyVisited.hasOwnProperty(moduleRoot)) return;

  alreadyVisited[moduleRoot] = true;

  listDirectories(moduleRoot, ({ external, fileName, fullFileName }) => {
    if (fileName.charAt(0) !== '@') {
      if (external) alternateRoots.push(fullFileName);
    } else {
      findAlternateRoots(fullFileName, alternateRoots, alreadyVisited);
    }
  });

  return alternateRoots;
}

function getPolyfillHelper() {
  let getPolyfills;

  // Get default react-native polyfills
  try {
    getPolyfills = require('react-native/rn-get-polyfills');
  } catch (e) {
    getPolyfills = () => [];
  }

  // See if project has custom polyfills, if so, include the PATH to them
  try {
    const customPolyfills = require.resolve('./polyfills.js');
    getPolyfills = (function (originalGetPolyfills) {
      return () => originalGetPolyfills().concat(customPolyfills);
    })(getPolyfills);
  } catch (e) {
    //ignore
  }

  return getPolyfills;
}

const PATH = require('path');
const FS = require('fs'),
  exclusionList = require('metro-config/src/defaults/exclusionList');

const repoDir = PATH.dirname(PATH.dirname(__dirname));

const moduleExclusionList = [
  new RegExp(repoDir + '/examples/ExpoMessaging/.*'),
  new RegExp(PATH.dirname(repoDir) + '/flat-list-mvcp/node_modules/.*'),
  new RegExp(PATH.dirname(repoDir) + '/flat-list-mvcp/Example/.*'),
  new RegExp(repoDir + '/examples/NativeMessaging/.*'),
  new RegExp(repoDir + '/examples/TypeScriptMessaging/.*'),
  //   new RegExp(repoDir + '/native-example/(.*)'),
  new RegExp(repoDir + '/expo-package/.*'),
  new RegExp(repoDir + '/native-package/node_modules/.*'),
  new RegExp(repoDir + '/node_modules/.*'),
],
  baseModulePath = resolvePath(__dirname, 'node_modules'),
  // watch alternate roots (outside of project root)
  alternateRoots = findAlternateRoots(),
  // build full module map for proper
  // resolution of modules in external roots
  extraNodeModules = buildModuleResolutionMap();

if (alternateRoots && alternateRoots.length)
  console.log('Found alternate project roots: ', alternateRoots);

console.log(moduleExclusionList);
module.exports = {
  resolver: {
    blacklistRE: exclusionList(moduleExclusionList),
    extraNodeModules,
    useWatchman: false,
  },
  watchFolders: [PATH.resolve(__dirname)].concat(alternateRoots),
  // transformer: {
  //   babelTransformerPath: require.resolve('./compiler/transformer'),
  // },
  serializer: {
    getPolyfills: getPolyfillHelper(),
  },
};



// /**
//  * Metro configuration for React Native
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// module.exports = {
//   transformer: {
//     getTransformOptions: async () => ({
//       transform: {
//         experimentalImportSupport: false,
//         inlineRequires: false,
//       },
//     }),
//   },
// };
