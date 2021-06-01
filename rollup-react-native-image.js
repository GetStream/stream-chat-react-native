/* eslint-env node */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export default function reactNativeImage(options = {}) {
  const includedImages = [];
  const extensions = options.extensions || ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
  let sourceDir = options.sourceDir || __dirname;
  if (sourceDir[sourceDir.length - 1] !== path.sep) {
    sourceDir += path.sep;
  }

  function toFileName(id) {
    if (id.startsWith(sourceDir)) {
      return id.slice(sourceDir.length - 1);
    }
    return path.basename(id);
  }

  return {
    load: (id) => {
      if (!extensions.includes(path.extname(id))) {
        return null;
      }

      if (!includedImages.includes(id)) {
        includedImages.push(id);
      }
      return `const img = require('./${toFileName(id)}'); export default img;`;
    },
    name: 'react-native-image',
    ongenerate: (options) => {
      for (const image of includedImages) {
        const origFileName = toFileName(image);
        const origSourceDir = image.slice(0, -origFileName.length + 1);
        const origDestDir = path.dirname(options.dest || options.file);
        const origDestPath = path.join(origDestDir, origFileName);
        const fullDestDir = path.dirname(origDestPath);

        if (!existsSync(fullDestDir)) {
          mkdirSync(fullDestDir, { recursive: true });
        }
        writeFileSync(origDestPath, readFileSync(image));

        const extension = path.extname(origDestPath);
        const base = path.basename(origDestPath, extension);
        const dir = path.dirname(origFileName);

        for (let i = 1; i < 6; i++) {
          const scaledFileName = path.join(dir, base + '@' + i + 'x' + extension);
          const scaledPath = path.join(origSourceDir, scaledFileName);
          const scaledDestPath = path.join(origDestDir, scaledFileName);
          if (!existsSync(scaledPath)) {
            continue;
          }
          writeFileSync(scaledDestPath, readFileSync(scaledPath));
        }
      }
    },
  };
}
