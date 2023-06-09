import {useEffect, useState} from 'react';
import {StreamChat, OwnUserResponse, UserResponse} from 'stream-chat';
import {StreamChatGenerics} from '../types';

export const useChatClient = <
  SCG extends StreamChatGenerics = StreamChatGenerics,
>({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string;
  userData?: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenOrProvider?: string;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    if (!userData) {
      return;
    }

    let didUserConnectInterrupt = false;
    let connectionPromise = client
      .connectUser(userData, tokenOrProvider)
      .then(() => {
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
          console.log('Connection closed');
        });
    };
  }, [apiKey, userData, tokenOrProvider]);

  return chatClient;
};
