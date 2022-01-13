import { API, FileInfo } from 'jscodeshift';
// @ts-expect-error
import importsTransform from './imports';
// @ts-expect-error
import functionTransform from './function';
// @ts-expect-error
import variableDeclarationTransform from './variable-declaration';

module.exports = function (fileInfo: FileInfo, api: API) {
  const transformAll = [
    importsTransform as (fileInfo: FileInfo, api: API) => typeof fileInfo.source,
    functionTransform as (fileInfo: FileInfo, api: API) => typeof fileInfo.source,
    // variableDeclarationTransform as (fileInfo: FileInfo, api: API) => typeof fileInfo.source,
  ].reduce((source, transformer) => {
    const newSource = transformer({ ...fileInfo, source }, api);
    return newSource.length > 0 ? newSource : source;
  }, fileInfo.source);

  return transformAll;
};
