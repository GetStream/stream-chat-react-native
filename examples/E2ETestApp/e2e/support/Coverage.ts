import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { createServer, IncomingMessage, Server } from 'http';
import { basename, join } from 'path';

import { isSource, repoRoot } from '../coverage/sources';

/**
 * Collects per-test coverage for the e2e impact analysis when `E2E_COVERAGE_DIR` is set (the
 * `test_e2e coverage:true` lane, on an `E2E_COVERAGE=1` build). The app posts the files it ran to this
 * server whenever it goes to the background (`src/e2eCoverage.ts`); after each test the suite sends
 * it home and writes `<dir>/<test file>/<test>/lcov.info`, which `build_test_coverage_map` reads.
 *
 * Every tracked source file is listed, also those the app never loaded: type-only modules leave the
 * bundle, so a change to one can't affect a test and selects none, instead of all of them.
 */
const coverageDir = process.env.E2E_COVERAGE_DIR;
const port = Number(process.env.E2E_COVERAGE_PORT ?? 4570);
const reportTimeout = 10000;

type Coverage = Record<string, number>;

export class CoverageCollector {
  private server?: Server;
  private latest?: Coverage;
  private waiting?: (coverage: Coverage) => void;
  private sources: string[] = [];

  static readonly enabled = !!coverageDir;

  /** The collector as the app sees it: the Android emulator reaches the host via 10.0.2.2. */
  get appUrl(): string {
    const host = device.getPlatform() === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:${port}/coverage`;
  }

  start(): Promise<void> {
    this.sources = execFileSync('git', ['-C', repoRoot, 'ls-files'], { encoding: 'utf8' })
      .split('\n')
      .filter(isSource);
    this.server = createServer((request, response) => {
      readBody(request)
        .then((body) => {
          this.latest = JSON.parse(body) as Coverage;
          this.waiting?.(this.latest);
          response.writeHead(204).end();
        })
        .catch(() => response.writeHead(400).end());
    });
    return new Promise((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(port, resolve);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  reset() {
    this.latest = undefined;
  }

  /**
   * Sends the app home and writes the report it posts. Falls back to the last report of this test
   * (a test can end in the background already), and writes nothing when there is none: the test then
   * stays out of the map and runs on every pull request until a coverage run collects it.
   */
  async collect(testPath: string, testName: string) {
    const report = new Promise<Coverage | undefined>((resolve) => {
      const timer = setTimeout(() => resolve(this.latest), reportTimeout);
      this.waiting = (coverage) => {
        clearTimeout(timer);
        resolve(coverage);
      };
    });
    try {
      await device.sendToHome();
    } catch (error) {
      console.warn(`Could not send the app home to collect the coverage of ${testName}`, error);
    }
    const coverage = await report;
    this.waiting = undefined;
    if (!coverage) {
      console.warn(`No coverage report for ${testName}`);
      return;
    }
    const dir = join(coverageDir!, basename(testPath, '.ts'), testName);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'lcov.info'), lcov({ ...zero(this.sources), ...coverage }));
  }
}

const readBody = (request: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => (body += chunk));
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

const zero = (files: string[]): Coverage => Object.fromEntries(files.map((file) => [file, 0]));

/** File level only: one line per file, hit when the file ran any code. */
const lcov = (coverage: Coverage) =>
  Object.entries(coverage)
    .map(([file, hit]) => `SF:${file}\nDA:1,${hit > 0 ? 1 : 0}\nend_of_record\n`)
    .join('');
