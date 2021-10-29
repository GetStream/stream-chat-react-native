import { registerNativeHandlers } from './src/native';
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

// eslint-disable-next-line no-underscore-dangle
const _consoleE = console.error;
console.error = (e) => {
  // For some reason following error gets rased from waitFor function.
  // Source of the error is in react-test-renderer, although cause of the
  // issue is unknown. Until we figure out the proper way to fix this issue,
  // following hack should work. We just suppress this particular error.
  // It should be safe since the error is only raised in dev environment
  // https://github.com/facebook/react/blob/b683c07ccce340b9d687683d5dd7347a4c866787/packages/react-dom/src/test-utils/ReactTestUtilsAct.js#L121
  if (e.indexOf('You called act(async () => ...) without await') === -1) {
    _consoleE(e);
  }
};
console.warn = () => {};

registerNativeHandlers({
  BlurView: () => null,
  compressImage: () => null,
  deleteFile: () => null,
  FlatList: () => null,
  getLocalAssetUri: () => null,
  getPhotos: () => null,
  NetInfo: {
    addEventListener: () => {},
    fetch: () =>
      new Promise((resolve) => {
        resolve();
      }),
  },
  pickDocument: () => null,
  saveFile: () => null,
  shareImage: () => null,
  takePhoto: () => null,
  triggerHaptic: () => null,
});

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: jest.fn(),
  DocumentDirectoryPath: jest.fn(),
  downloadFile: jest.fn(),
  exists: jest.fn(),
  ExternalDirectoryPath: jest.fn(),
  ExternalStorageDirectoryPath: jest.fn(),
  LibraryDirectoryPath: jest.fn(),
  mkdir: jest.fn(),
  PicturesDirectoryPath: jest.fn(),
  TemporaryDirectoryPath: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const react = require('react-native');
  return {
    __esModule: true,
    default: react.View,
    BottomSheetScrollView: react.ScrollView,
    BottomSheetFlatList: react.FlatList,
  };
});
// jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
