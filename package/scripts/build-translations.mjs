import child_process from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';

const exec = promisify(child_process.exec);

const i18nCacheDir = '.tmpi18ncache';

async function cleanI18nCache() {
  await exec('rm -rf ' + i18nCacheDir);
  console.log('Deleted ' + i18nCacheDir);
}

async function createI18nCacheDir() {
  await mkdir(i18nCacheDir);
  console.log('created ' + i18nCacheDir);
}

async function compileTranslations() {
  await exec(
    "yarn run babel --config-file ./babel.i18next-extract.json 'src/**/*.{js,jsx,ts,tsx}' --out-dir '" +
      i18nCacheDir +
      "'",
  );
  console.log('Compiled translations');
}

async function formatI18nFiles() {
  await exec(
    "prettier --write 'src/i18n/*.{js,ts,tsx,md,json}' .eslintrc.json ../.prettierrc .babelrc",
  );
  console.log('Formatted i18n files');
}

const run = async () => {
  try {
    await cleanI18nCache();
    await createI18nCacheDir();
    await compileTranslations();
    // FIXME: The steps above are redundant at this point
    await cleanI18nCache();
    await formatI18nFiles();
  } catch (error) {
    console.error(`Error during build-translations: ${error}`);
  }
};

run();
