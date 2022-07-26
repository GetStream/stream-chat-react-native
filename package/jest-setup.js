/* global require */
import { FlatList, View } from 'react-native';

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
  SDK: 'stream-chat-react-native',
  shareImage: () => null,
  Sound: { initializeSound: () => null, Player: View },
  takePhoto: () => null,
  triggerHaptic: () => null,
  Video: View,
});

jest.mock('react-native-reanimated', () => {
  const RNReanimatedmock = require('react-native-reanimated/mock');
  return { ...RNReanimatedmock, runOnUI: (fn) => fn };
});

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
