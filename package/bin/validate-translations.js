/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');
const i18nDirectoryRelativePath = '../src/i18n/';
const directoryPath = path.join(__dirname, i18nDirectoryRelativePath);
let countMissingTranslations = 0;

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  files.forEach(function (file) {
    if (file.split('.').reverse()[0] !== 'json') return;
    // Do whatever you want to do with the file
    const data = require(i18nDirectoryRelativePath + file);
    const keys = Object.keys(data);
    keys.forEach((key) => {
      if (!data[key] || data[key] === '') {
        countMissingTranslations = countMissingTranslations + 1;
        console.error('Missing translation for key "' + key + '" in "' + file + '"');
      }
    });
  });

  if (countMissingTranslations > 0) {
    process.exitCode = 2;
    process.exit();
  } else {
    process.exit(0);
  }
});
