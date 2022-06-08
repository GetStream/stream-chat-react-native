import React, { PropsWithChildren, useContext } from 'react';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

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
export const OwnCapabilitiesContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as OwnCapabilitiesContextValue,
);

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

export const useOwnCapabilitiesContext = () => {
  const contextValue = useContext(OwnCapabilitiesContext);

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useOwnCapabilitiesContext hook was called outside the Channel Component. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
