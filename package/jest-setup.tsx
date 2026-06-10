/* global require */
import type { ReactNode } from 'react';
import { FlatList, View } from 'react-native';

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

import { registerNativeHandlers } from './src/native';

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

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock.js'));
// RNGH 3 throws if GestureDetector is not inside GestureHandlerRootView; tests
// don't wrap renders in a root view, so default the context to true.
jest.mock('react-native-gesture-handler/src/GestureHandlerRootViewContext', () => {
  const React = require('react');
  return { __esModule: true, default: React.createContext(true) };
});
jest.mock('react-native-gesture-handler/lib/module/GestureHandlerRootViewContext', () => {
  const React = require('react');
  return { __esModule: true, default: React.createContext(true) };
});
jest.mock('react-native-reanimated', () => {
  const RNReanimatedmock = require('react-native-reanimated/mock');
  return {
    ...RNReanimatedmock,
    // RNGH v3 hooks introspect Reanimated's exports; the v4 mock omits several
    // helpers it now relies on, so we stub them here.
    isSharedValue: (value: unknown): boolean =>
      typeof value === 'object' && value !== null && 'value' in value,
    isWorkletFunction: () => false,
    NativeEventsManager: class {
      attachEvents() {}
      detachEvents() {}
      updateEvents() {}
    },
    runOnUI: (fn: () => unknown) => fn,
    useComposedEventHandler: (handlers: ((event: unknown) => void)[]) => (event: unknown) =>
      handlers.forEach((h) => h?.(event)),
    useEvent: (cb: (event: unknown) => void) => cb,
    useHandler: () => ({ context: {}, doDependenciesDiffer: false }),
  };
});

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);

const BottomSheetMock = ({
  handleComponent,
  children,
}: {
  handleComponent: () => ReactNode;
  children: ReactNode;
}) => (
  <View>
    {handleComponent()}
    {children}
  </View>
);
jest.mock('@gorhom/bottom-sheet', () => {
  const react = require('react-native');
  return {
    __esModule: true,
    BottomSheetFlatList: react.FlatList,
    BottomSheetModal: react.View,
    BottomSheetModalProvider: react.View,
    BottomSheetScrollView: react.ScrollView,
    default: BottomSheetMock,
    TouchableOpacity: react.View,
    useBottomSheetSpringConfigs: jest.fn(() => ({})),
  };
});
jest.mock('@op-engineering/op-sqlite', () => {
  const { sqliteMock } = require('./src/mock-builders/DB/mock');
  return sqliteMock;
});
// RN 0.80 introduced a bug which is reported here: https://github.com/facebook/react-native/issues/51993#issuecomment-2970614900
// This can be removed once it's resolved.
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({
  __esModule: true,
  default: require('./__mocks__/RefreshControlMock'),
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: undefined,
}));

jest.mock('react-native-teleport', () => {
  const rn = require('react-native');
  return {
    Portal: rn.View,
    PortalHost: rn.View,
    PortalProvider: rn.View,
    usePortal: jest.fn().mockReturnValue({ removePortal: jest.fn() }),
  };
});

jest.mock('react-native-teleport', () => {
  const rn = require('react-native');
  return {
    Portal: rn.View,
    PortalHost: rn.View,
    PortalProvider: rn.View,
    usePortal: jest.fn().mockReturnValue({ removePortal: jest.fn() }),
  };
});

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

jest.mock('./src/components/Message/utils/measureInWindow', () => ({
  measureInWindow: jest.fn(async () => ({
    x: 10,
    y: 100,
    w: 250,
    h: 60,
  })),
}));
