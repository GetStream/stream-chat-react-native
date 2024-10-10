import React, { PropsWithChildren, useContext } from 'react';

export type ChatConfigContextValue = {
  /**
   * This option allows you to specify a list of CDNs that offer image resizing.
   */
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
