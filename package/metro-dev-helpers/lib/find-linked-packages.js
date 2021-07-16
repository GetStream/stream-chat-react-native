/* eslint-env node */

const PATH = require('path');

const LINK_STRING = 'link:';

module.exports = function findLinkedPackages(repoDir) {
  const pjson = require(PATH.join(repoDir, 'package.json'));
  const dependencies = {...pjson.dependencies, ...pjson.devDependencies};
  const linkedDependencies = Object.entries(dependencies).filter(([,value]) => {
    return value.slice(0, LINK_STRING.length) === LINK_STRING;
  });

  const linkedDependenciesPathMap = linkedDependencies.reduce((acc, [nextKey, nextValue]) => {
    acc[nextKey] = PATH.resolve(nextValue.replace(LINK_STRING, ''));
    return acc;
  }, {})

  return linkedDependenciesPathMap;
};
