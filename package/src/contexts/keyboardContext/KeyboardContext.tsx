import React, { useContext } from 'react';
import { Keyboard } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

import { getDisplayName } from '../utils/getDisplayName';

export type KeyboardContextValue = {
  dismissKeyboard: () => void;
};

export const KeyboardContext = React.createContext<KeyboardContextValue>({
  dismissKeyboard: Keyboard.dismiss,
});

export const KeyboardProvider: React.FC<{
  value: KeyboardContextValue;
}> = ({ children, value }) => (
  <KeyboardContext.Provider value={value}>{children}</KeyboardContext.Provider>
);

export const useKeyboardContext = () => useContext(KeyboardContext);

export const withKeyboardContext = <StreamChatClient extends ExtendableGenerics>(
  Component: React.ComponentType<StreamChatClient>,
): React.FC<Omit<StreamChatClient, keyof KeyboardContextValue>> => {
  const WithKeyboardContextComponent = (
    props: Omit<StreamChatClient, keyof KeyboardContextValue>,
  ) => {
    const keyboardContext = useKeyboardContext();

    return <Component {...(props as StreamChatClient)} {...keyboardContext} />;
  };
  WithKeyboardContextComponent.displayName = `WithKeyboardContext${getDisplayName(Component)}`;
  return WithKeyboardContextComponent;
};
