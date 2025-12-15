import React, { useContext } from 'react';

import { SharedValue } from 'react-native-reanimated';

import type { Streami18n } from '../../utils/i18n/Streami18n';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type Overlay = 'alert' | 'gallery' | 'none';

export type OverlayContextValue = {
  overlay: Overlay;
  overlayOpacity: SharedValue<number>;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  style?: DeepPartial<Theme>;
};

export const OverlayContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as OverlayContextValue,
);

export type OverlayProviderProps = {
  /** https://github.com/GetStream/stream-chat-react-native/wiki/Internationalization-(i18n) */
  i18nInstance?: Streami18n;
  value?: Partial<OverlayContextValue>;
};

export const useOverlayContext = () => {
  const contextValue = useContext(OverlayContext);

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useOverlayContext hook was called outside the OverlayContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue;
};
