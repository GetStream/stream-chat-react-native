// eslint-disable-next-line no-undef
module.exports = {
  verbose: true,
  testRegex: [
    /**
     * If you want to test single file, mention it here
     * e.g.,
     * "src/components/ChannelList/__tests__/ChannelList.test.js",
     * "src/components/MessageList/__tests__/MessageList.test.js"
     */
  ],
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
    '@stream-io/styled-components':
      '<rootDir>/node_modules/@stream-io/styled-components/native/dist/styled-components.native.cjs.js',
  },
  preset: 'react-native',
  setupFiles: [require.resolve('./jest-setup.js')],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '__snapshots__'],
};
