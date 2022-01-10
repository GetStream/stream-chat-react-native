/* global require */
import { FlatList } from 'react-native';

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

import { registerNativeHandlers } from './src/native';

// eslint-disable-next-line no-underscore-dangle

console.warn = () => {};

export let netInfoFetch = jest.fn();

export const setNetInfoFetchMock = (fn) => {
  netInfoFetch = fn;
};
registerNativeHandlers({
  compressImage: () => null,
  deleteFile: () => null,
  FlatList,
  getLocalAssetUri: () => null,
  getPhotos: () => null,
  NetInfo: {
    addEventListener: () => () => null,
    fetch: () =>
      new Promise((resolve) => {
        resolve(true);
        netInfoFetch();
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
jest.mock('@gorhom/bottom-sheet', () => {
  const react = require('react-native');
  return {
    __esModule: true,
    BottomSheetFlatList: react.FlatList,
    BottomSheetModal: react.View,
    BottomSheetModalProvider: react.View,
    BottomSheetScrollView: react.ScrollView,
    default: react.View,
  };
});
// jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
