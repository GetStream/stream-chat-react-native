import React, { useContext } from 'react';

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay = 'channelInfo' | 'none' | 'userInfo';

export type AppOverlayContextValue = {
  overlay: Overlay;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
};
export const AppOverlayContext = React.createContext<AppOverlayContextValue>(
  {} as AppOverlayContextValue,
);

export type AppOverlayProviderProps = {
  value?: Partial<AppOverlayContextValue>;
};

export const useAppOverlayContext = () => useContext(AppOverlayContext);
