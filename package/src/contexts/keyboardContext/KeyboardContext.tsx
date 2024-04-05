import React, { useContext } from 'react';

import { Keyboard } from 'react-native';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type KeyboardContextValue = {
  dismissKeyboard: () => void;
};

export const KeyboardContext = React.createContext({
  dismissKeyboard: Keyboard.dismiss,
});

type Props = React.PropsWithChildren<{
  value: KeyboardContextValue;
}>;

export const KeyboardProvider = ({ children, value }: Props) => (
  <KeyboardContext.Provider value={value}>{children}</KeyboardContext.Provider>
);

export const useKeyboardContext = () => useContext(KeyboardContext);

export const withKeyboardContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<StreamChatGenerics>,
): React.ComponentType<Omit<StreamChatGenerics, keyof KeyboardContextValue>> => {
  const WithKeyboardContextComponent = (
    props: Omit<StreamChatGenerics, keyof KeyboardContextValue>,
  ) => {
    const keyboardContext = useKeyboardContext();

    return <Component {...(props as StreamChatGenerics)} {...keyboardContext} />;
  };
  WithKeyboardContextComponent.displayName = `WithKeyboardContext${getDisplayName(
    Component as React.ComponentType,
  )}`;
  return WithKeyboardContextComponent;
};
