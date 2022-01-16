import { exec, fork } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

function buildTranslations() {
  return new Promise((resolve, reject) => {
    const proc = fork('./scripts/build-translations.mjs');
    proc.stdio = ['pipe', 'pipe', 'pipe'];

    proc.on('error', (error) => {
      console.error(`Error building translations: ${error}`);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(`Non-zero exit code returned while building translations`);
      }
      console.log('Finishing building translations');
      return resolve();
    });
  });
}

function buildSources() {
  return new Promise((resolve, reject) => {
    const proc = fork('./scripts/build-sources.mjs', { stdio: 'pipe' });

    proc.stdout.on('data', function (data) {
      process.stdout.write(data);
    });

    proc.stderr.on('data', function (data) {
      process.stdout.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        return resolve();
      }
      return reject(`Non-zero error code building sources: ${code}`);
    });

    proc.on('error', (error) => {
      std_err += error.toString();
      console.log(error.toString());
    });
  });
}

async function copyTranslations() {
  process.stdout.write(
    `\u001b[34mℹ\u001b[0m Copying translation files to \u001b[34mlib/typescript/i18n\u001b[0m\n`,
  );
  return await execPromise('cp -R -f ./src/i18n ./lib/typescript/i18n');
}

const run = async () => {
  try {
    await buildTranslations();
    await buildSources();
    await copyTranslations();
  } catch (error) {
    console.error(`Error during build: ${error}`);
    process.exit(1);
  }
};

run();
