// /**
//  * Metro configuration for React Native
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */
// /* eslint-env node */

// const fs = require('fs');
// const path = require('path');
// const blacklist = require('metro-config/src/defaults/blacklist');
// const repoDir = path.dirname(path.dirname(__dirname));

// console.log('VISHAL VISHAL');
// console.log(repoDir);
// const actualBlacklist = blacklist([
//   // new RegExp(repoDir + '/examples/one/node_modules/.*'),
//   //   new RegExp(repoDir + '/native-example/(.*)'),
//   // new RegExp(repoDir + '/expo-package/.*'),
//   // new RegExp(repoDir + '/native-package/node_modules/.*'),
//   // new RegExp(repoDir + '/node_modules/.*'),
// ]);

// module.exports = {
//   // transformer: {
//   //   getTransformOptions: async () => ({
//   //     transform: {
//   //       experimentalImportSupport: true,
//   //       inlineRequires: true,
//   //     },
//   //   }),
//   // },
//   // projectRoot: __dirname,
//   resolver: {
//     // blacklistRE: actualBlacklist,
//     extraNodeModules: getNodeModulesForDirectory(path.resolve('.')),
//   },
// };

// // console.log('unfindable module', module.exports.resolver.extraNodeModules['stream-chat-react-native']);
// function getNodeModulesForDirectory(rootPath) {
//   const nodeModulePath = path.join(rootPath, 'node_modules');
//   const folders = fs.readdirSync(nodeModulePath);
//   return folders.reduce((modules, folderName) => {
//     const folderPath = path.join(nodeModulePath, folderName);
//     if (folderName.startsWith('@')) {
//       const scopedModuleFolders = fs.readdirSync(folderPath);
//       const scopedModules = scopedModuleFolders.reduce(
//         (scopedModules, scopedFolderName) => {
//           scopedModules[
//             `${folderName}/${scopedFolderName}`
//           ] = maybeResolveSymlink(path.join(folderPath, scopedFolderName));
//           return scopedModules;
//         },
//         {},
//       );
//       return Object.assign({}, modules, scopedModules);
//     }
//     modules[folderName] = maybeResolveSymlink(folderPath);
//     return modules;
//   }, {});
// }

// function maybeResolveSymlink(maybeSymlinkPath) {
//   if (fs.lstatSync(maybeSymlinkPath).isSymbolicLink()) {
//     const resolved = path.resolve(
//       path.dirname(maybeSymlinkPath),
//       fs.readlinkSync(maybeSymlinkPath),
//     );
//     return resolved;
//   }
//   return maybeSymlinkPath;
// }
