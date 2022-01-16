import { exec, spawn } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);
import { transformAsync } from '@babel/core';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import readline from 'readline';
import { statSync } from 'fs';
import path from 'path';

async function cleanLib() {
  await execPromise('rm -rf lib/');
  process.stdout.write('Deleted lib/\n');
}

/**
 * Writes a simple status indicator to stderr
 * to visually indicate that something is happening
 * since compilation takes some time.
 *
 * Written to stderr to not clutter the output if
 * it's written to somewhere that's not a tty,
 * for example a file.
 * */
const startProgressIndicator = (message) => {
  process.stderr.write('\x1B[?25l');
  process.stderr.write(message);

  let idx = 0;
  return setInterval(() => {
    readline.cursorTo(process.stderr, 0);
    readline.clearLine(process.stderr, 0);
    process.stderr.write(`${message}${'.'.repeat(++idx)}`);
    if (idx >= 3) {
      idx = 0;
    }
  }, 500);
};

function compileTypescriptDeclarations() {
  return new Promise((resolve, reject) => {
    const proc = spawn('tsc', [
      '--pretty',
      '--declaration',
      '--emitDeclarationOnly',
      '--project',
      'tsconfig.json',
      '--outDir',
      'lib/typescript',
    ]);

    /**
     * tsc writes errors to stderr, matching their error message to
     * catch it on our end.
     * */
    const tsErrorRegExp = /([\w\/\.]+:[\d]+:[\d]+ - error.*)/;
    proc.stdout.on('data', (data) => {
      if (tsErrorRegExp.test(data.toString())) {
        reject(data);
      }
      reject(`TSOUT: ${data}`);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(`Non-zero exit code returned while building typescript`);
      }
      return resolve(`Compiled typescript sources to lib/typescript\n`);
    });
  });
}

const excludedDirectories = ['__tests__', '__mocks__', '__fixtures__', 'mock-builders'];
const extToInclude = ['.ts', '.js', '.tsx', '.jsx'];

/**
 * Recursively walk {dir}, yield any file with extensions
 * defined in `extToInclude`. Ignores walking directories
 * in `excludedDirectories`.
 * */
async function* walkDirectory(dir) {
  const files = await readdir(dir);
  for (const file of files) {
    if (excludedDirectories.includes(file)) {
      continue;
    }
    const filePath = path.join(dir, file);
    const stt = statSync(filePath);
    if (stt.isDirectory()) {
      yield* await walkDirectory(filePath);
      continue;
    }

    if (extToInclude.includes(path.extname(file))) {
      yield filePath;
    }
  }
}

async function transformFileWithBabel(file, options) {
  const content = await readFile(file);
  const result = await transformAsync(content, {
    filename: file,
    configFile: options.configFile,
  });

  const fileComponents = path.parse(path.relative(options.sourceDir, file));
  const outputFileName = path.join(
    options.outputDir,
    fileComponents.dir,
    `${fileComponents.name}.js`,
  );
  await mkdir(path.dirname(outputFileName), { recursive: true });
  await writeFile(outputFileName, result.code);
}

async function transformAllFiles(options) {
  const dir = await walkDirectory(options.sourceDir);
  let count = 0;

  for await (const file of dir) {
    try {
      // process.stderr.write(`Transforming file ${file}\n`);
      await transformFileWithBabel(file, options);
    } catch (error) {
      console.log(`Hmmm ${error}`);
      throw new Error(`Error compiling file ${file}: ${error}`);
    }
    count++;
  }
  process.stdout.write(`Compiled ${count} files to ${options.outputDir}\n`);
  return `Compiled ${count} files to ${options.outputDir}\n`;
}

async function buildCommonjs() {
  const options = {
    configFile: path.join(process.cwd(), 'babel.config.js'),
    outputDir: path.join(process.cwd(), 'lib', 'commonjs'),
    sourceDir: path.join(process.cwd(), 'src'),
  };
  return transformAllFiles(options);
}

async function buildModule() {
  const options = {
    configFile: path.join(process.cwd(), 'babel.config.js'),
    outputDir: path.join(process.cwd(), 'lib', 'module'),
    sourceDir: path.join(process.cwd(), 'src'),
  };
  return transformAllFiles(options);
}

const run = async () => {
  const progressIndicator = startProgressIndicator('Building sources');
  progressIndicator.unref();

  try {
    await cleanLib();

    console.log('starting');
    const res = await Promise.all([
      compileTypescriptDeclarations(),
      buildCommonjs(),
      buildModule(),
    ]);
    return process.stdout.write(res.join(''));
  } catch (error) {
    process.stderr.write(`\nError building sources: ${error}`);
  } finally {
    clearInterval(progressIndicator);
  }
};

run();
