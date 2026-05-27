// Fallback for TS module resolution under `moduleResolution: bundler`.
// Metro picks StreamTokens.{ios,android,web}.ts at bundle time via its own
// platform-aware resolver; this barrel is only used when no platform variant
// matches (e.g. type-checking the SDK against the default file).
export * from './StreamTokens.web';
