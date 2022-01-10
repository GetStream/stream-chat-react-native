import React, { useContext } from 'react';
import { Keyboard } from 'react-native';

import type { UnknownType } from '../../types/types';
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

export const withKeyboardContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof KeyboardContextValue>> => {
  const WithKeyboardContextComponent = (props: Omit<P, keyof KeyboardContextValue>) => {
    const keyboardContext = useKeyboardContext();

    return <Component {...(props as P)} {...keyboardContext} />;
  };
  WithKeyboardContextComponent.displayName = `WithKeyboardContext${getDisplayName(Component)}`;
  return WithKeyboardContextComponent;
};
