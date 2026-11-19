// `STREAM_CHAT_SPM_ONLY=1` sets up the Swift Package Manager smoke build (`index.spm.js`). iOS then
// autolinks only the SDK, since most other native libraries here ship no Package.swift yet.
const spmOnly = process.env.STREAM_CHAT_SPM_ONLY === '1';
const sdkPackages = ['react-native', 'stream-chat-react-native'];

const iosDisabledForSpm = spmOnly
  ? Object.fromEntries(
      Object.keys(require('./package.json').dependencies)
        .filter((name) => !sdkPackages.includes(name))
        .map((name) => [name, { platforms: { ios: null } }]),
    )
  : {};

module.exports = {
  project: {
    android: {},
    ios: {
      automaticPodsInstallation: !spmOnly,
    },
  },
  dependencies: iosDisabledForSpm,
};
