import React, { PropsWithChildren, useContext } from 'react';

export type ChatConfigContextValue = {
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
