import { useEffect, useRef, useState } from 'react';

import { StreamChat } from 'stream-chat';

import type {
  OwnUserResponse,
  StreamChatOptions,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

/**
 * React hook to create, connect and return `StreamChat` client.
 */
export const useCreateChatClient = ({
  apiKey,
  options,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse | UserResponse;
  options?: StreamChatOptions;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  const userDataRef = useRef(userData);
  userDataRef.current = userData;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const client = new StreamChat(apiKey, undefined, optionsRef.current);
    let didUserConnectInterrupt = false;

    const connectionPromise = client.connectUser(userDataRef.current, tokenOrProvider).then(() => {
      if (!didUserConnectInterrupt) {
        setChatClient(client);
      }
    });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log(`Connection for user "${userDataRef.current.id}" has been closed`);
        });
    };
    // we should recompute the client on user id change
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};
