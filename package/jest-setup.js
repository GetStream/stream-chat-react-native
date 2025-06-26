/* global require */
import { FlatList, View } from 'react-native';

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

import { registerNativeHandlers } from './src/native';

// eslint-disable-next-line no-underscore-dangle

console.warn = () => {};

registerNativeHandlers({
  Audio: {
    startPlayer: jest.fn(),
    startRecording: jest.fn(() => ({ accessGranted: true, recording: 'some-recording-path' })),
    stopPlayer: jest.fn(),
    stopRecording: jest.fn(),
  },
  compressImage: () => null,
  deleteFile: () => null,
  FlatList,
  getLocalAssetUri: () => null,
  getPhotos: () => null,
  oniOS14GalleryLibrarySelectionChange: () => ({
    unsubscribe: () => {},
  }),
  pickDocument: () => null,
  pickImage: () => null,
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
    TouchableOpacity: react.View,
  };
});
jest.mock('@op-engineering/op-sqlite', () => {
  const { sqliteMock } = require('./src/mock-builders/DB/mock');
  return sqliteMock;
});
