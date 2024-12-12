import React, { useContext } from 'react';

import { Keyboard } from 'react-native';

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
