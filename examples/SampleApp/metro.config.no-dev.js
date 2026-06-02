/**
 * Metro config that forces a `dev=false` bundle for performance profiling.
 *
 * Use this to measure scroll/render perf WITHOUT React's dev-mode wrappers
 * (`runWithFiberInDEV`, `getComponentStack`, etc — they account for ~22%
 * of a captured profile and don't exist in release builds). Bundle is still
 * unminified so function names stay readable in the .cpuprofile.
 *
 * Usage:
 *   yarn workspace sampleapp start --config metro.config.no-dev.js --reset-cache
 *
 * Then reload the app (shake → Reload, or `r` in Metro). The next bundle
 * fetch will be served with dev=false regardless of what the app asks for.
 * Run `node perf/capture-hermes-profile.js` as usual. To restore normal
 * dev mode just stop Metro and start it again without `--config`.
 *
 * NOTE: this only changes the served JS bundle. The native binary is still
 * a debug build; native code paths (Yoga, layout, view creation, image
 * decoding) remain debug-instrumented. To benchmark a true release native
 * pipeline you'd need to build a release variant of the app itself.
 */
const baseConfig = require('./metro.config.js');

module.exports = {
  ...baseConfig,
  server: {
    ...(baseConfig.server || {}),
    enhanceMiddleware: (middleware, metroServer) => {
      const wrapped =
        baseConfig.server && typeof baseConfig.server.enhanceMiddleware === 'function'
          ? baseConfig.server.enhanceMiddleware(middleware, metroServer)
          : middleware;
      return (req, res, next) => {
        if (req.url && req.url.includes('dev=true')) {
          req.url = req.url.replace(/([?&])dev=true/g, '$1dev=false');
          // Print once-per-request so it's obvious what's happening.
          process.stdout.write(`[no-dev] rewrote bundle URL to: ${req.url}\n`);
        }
        return wrapped(req, res, next);
      };
    },
  },
};
