import React, { PropsWithChildren, useContext } from 'react';

import type { HandlePlaybackStarted } from '../../types/types';

export type ChatConfigContextValue = {
  /**
   * Decides what playing an audio, voice recording or video attachment does. Defaults to marking the
   * message played. Render the provider above `OverlayProvider` so it also reaches videos played in
   * the gallery.
   */
  handlePlaybackStarted?: HandlePlaybackStarted;
  /** CDN hosts whose image URLs can be resized. Defaults to `['.stream-io-cdn.com']`. */
  resizableCDNHosts?: string[];
};

export const chatConfigContextDefaultvalue = {
  resizableCDNHosts: ['.stream-io-cdn.com'],
};

export const ChatConfigContext = React.createContext<ChatConfigContextValue>(
  chatConfigContextDefaultvalue,
);

export const ChatConfigProvider = ({
  children,
  value = chatConfigContextDefaultvalue,
}: PropsWithChildren<{
  value?: ChatConfigContextValue;
}>) => (
  <ChatConfigContext.Provider value={value as unknown as ChatConfigContextValue}>
    {children}
  </ChatConfigContext.Provider>
);

export const useChatConfigContext = () => {
  const contextValue = useContext(ChatConfigContext) as unknown as ChatConfigContextValue;

  return contextValue;
};
