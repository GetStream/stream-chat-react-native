import React, { PropsWithChildren, useContext } from 'react';

export const allOwnCapabilities = {
  banChannelMembers: 'ban-channel-members',
  deleteAnyMessage: 'delete-any-message',
  deleteOwnMessage: 'delete-own-message',
  flagMessage: 'flag-message',
  pinMessage: 'pin-message',
  quoteMessage: 'quote-message',
  readEvents: 'read-events',
  sendLinks: 'send-links',
  sendMessage: 'send-message',
  sendReaction: 'send-reaction',
  sendReply: 'send-reply',
  sendTypingEvents: 'send-typing-events',
  updateAnyMessage: 'update-any-message',
  updateOwnMessage: 'update-own-message',
  uploadFile: 'upload-file',
};

export type OwnCapability = keyof typeof allOwnCapabilities;

export type OwnCapabilitiesContextValue = Record<OwnCapability, boolean>;
export const OwnCapabilitiesContext = React.createContext({} as OwnCapabilitiesContextValue);

export const OwnCapabilitiesProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: OwnCapabilitiesContextValue;
}>) => (
  <OwnCapabilitiesContext.Provider value={value as unknown as OwnCapabilitiesContextValue}>
    {children}
  </OwnCapabilitiesContext.Provider>
);

export const useOwnCapabilitiesContext = (componentName?: string) => {
  const contextValue = useContext(OwnCapabilitiesContext);

  if (!contextValue) {
    console.warn(
      `The useOwnCapabilitiesContext hook was called outside the Channel Component. Make sure this hook is called within a child of the OwnCapabilitiesProvider component within Channel Component. The errored call is located in the ${componentName} component.`,
    );
    return {} as OwnCapabilitiesContextValue;
  }

  return contextValue as OwnCapabilitiesContextValue;
};
