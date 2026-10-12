// Perf-gauntlet Metro config. Wraps a SampleApp's own config (GAUNTLET_APP = that SampleApp's directory,
// in this repo or in an exported baseline tree) and changes only what the measurement needs:
// - probe.js / probe-llc.js load before anything else (in place of index.js's first import)
// - the bench users' static tokens (runtime/generated/ChatUsers.gauntlet.ts, gitignored) replace src/ChatUsers
// - the channel list loads 100 messages per channel (gauntlet-transformer.js)
// - function names survive minification, so per-component attribution is exact
// - React's PROFILING Fabric renderer replaces the prod one (fiber timings in a release bundle)
// Nothing in the SampleApp or the SDK is edited on disk.
const path = require('path');
const APP = process.env.GAUNTLET_APP;
if (!APP) throw new Error('GAUNTLET_APP is not set');
const base = require(path.join(APP, 'metro.config.js'));
// Only runtime/ is watched: out/ can hold whole exported baseline trees (with node_modules).
const RUNTIME = path.join(__dirname, 'runtime');
const SHIM = path.join(RUNTIME, 'entry-shim.js');
const TOKENS = path.join(RUNTIME, 'generated', 'ChatUsers.gauntlet.ts');
process.env.GAUNTLET_UPSTREAM_TRANSFORMER = base.transformer.babelTransformerPath;
module.exports = {
  ...base,
  projectRoot: APP,
  transformer: {
    ...base.transformer,
    babelTransformerPath: path.join(__dirname, 'gauntlet-transformer.js'),
    // Mangling renames components, so names collide or disappear. Same on both sides; names only.
    minifierConfig: {
      ...base.transformer.minifierConfig,
      keep_fnames: true,
      keep_classnames: true,
      mangle: {
        ...(base.transformer.minifierConfig || {}).mangle,
        keep_fnames: true,
        keep_classnames: true,
      },
      compress: {
        ...(base.transformer.minifierConfig || {}).compress,
        keep_fnames: true,
        keep_classnames: true,
      },
    },
  },
  watchFolders: [...(base.watchFolders || []), RUNTIME],
  resolver: {
    ...base.resolver,
    resolveRequest: (context, moduleName, platform) => {
      // index.js's first import: the probe must be installed before anything can load the renderer.
      if (
        moduleName === './src/utils/bootstrapBackgroundMessageHandler' &&
        context.originModulePath === path.join(APP, 'index.js')
      ) {
        return { filePath: SHIM, type: 'sourceFile' };
      }
      if (moduleName === 'gauntlet-real-entry') {
        return {
          filePath: path.join(APP, 'src/utils/bootstrapBackgroundMessageHandler.ts'),
          type: 'sourceFile',
        };
      }
      if (
        /(^|\/)ChatUsers$/.test(moduleName) &&
        context.originModulePath.startsWith(path.join(APP, 'src'))
      ) {
        return { filePath: TOKENS, type: 'sourceFile' };
      }
      if (/implementations\/ReactFabric-prod$/.test(moduleName)) {
        return context.resolveRequest(
          context,
          moduleName.replace(/-prod$/, '-profiling'),
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
