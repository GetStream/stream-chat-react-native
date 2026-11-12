import { createServer } from 'net';

declare const process: { env: Record<string, string | undefined> };

/** A port free on the host's IPv4 and IPv6 loopback: `::` listens on both (dual stack). */
const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen({ host: '::', port: 0 }, () => {
      const address = server.address();
      server.close(() =>
        address && typeof address === 'object'
          ? resolve(address.port)
          : reject(new Error('No free port')),
      );
    });
  });

/**
 * Client for `stream-chat-test-mock-server`. The driver (`driver.rb`) spawns one mock server per
 * test on its own port; `start` asks it for one and `stop` shuts it down.
 *
 * Unlike the native suites, the test code runs on the host, so robots always talk to `localhost`
 * while the app gets `appUrl`, which is the host as the device sees it.
 */
export class MockServer {
  static readonly driverPort = process.env.MOCK_DRIVER_PORT ?? '4569';
  private static readonly driverUrl = `http://localhost:${MockServer.driverPort}`;

  private port?: string;

  /** The mock server as the test runner (host) sees it. */
  get url(): string {
    if (!this.port) {
      throw new Error('MockServer is not started');
    }
    return `http://localhost:${this.port}`;
  }

  /** The mock server as the app under test sees it: the Android emulator reaches the host via 10.0.2.2. */
  get appUrl(): string {
    const host = device.getPlatform() === 'android' ? '10.0.2.2' : 'localhost';
    return this.url.replace('localhost', host);
  }

  /**
   * Every call to the driver's `/start` spawns a new server, so a start is only retried after the
   * server failed to answer, and always on a new port.
   *
   * The port is picked here rather than by the driver: on CI the driver's probe twice handed out a
   * port the server then never answered on (41215, an hour apart, nightly 43138494994). This probe
   * also checks IPv6, which `localhost` may resolve to.
   */
  async start(testName: string, attempts = 3): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      const port = await freePort();
      const response = await this.execute(
        `${MockServer.driverUrl}/start/${encodeURIComponent(testName)}` +
          `?api_version=v2&timestamps=ns&port=${port}`,
      );
      this.port = (await response.text()).trim();
      try {
        await this.waitUntilReady();
        return;
      } catch (error) {
        await this.stop();
        if (attempt >= attempts) {
          throw error;
        }
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.port) {
      return;
    }
    await this.getRequest('stop').catch(() => undefined);
    this.port = undefined;
  }

  async postRequest(endpoint: string, body = ''): Promise<string> {
    const response = await this.execute(`${this.url}/${endpoint}`, {
      body,
      headers: { 'Content-Type': 'text/plain' },
      method: 'POST',
    });
    return response.text();
  }

  async getRequest(endpoint: string): Promise<string> {
    const response = await this.execute(`${this.url}/${endpoint}`);
    return response.text();
  }

  private async waitUntilReady(timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${this.url}/ping`);
        if (response.ok) {
          return;
        }
      } catch {
        // The server process is still booting.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`MockServer did not start within ${timeoutMs}ms on ${this.url}`);
  }

  private async execute(url: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`${init?.method ?? 'GET'} ${url} failed: ${response.status}`);
    }
    return response;
  }
}
