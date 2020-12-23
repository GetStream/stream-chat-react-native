import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import { USER_TOKENS, USERS } from '../ChatUsers';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';
import AsyncStore from '../utils/AsyncStore';

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  > | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const switchUser = async (userId?: string) => {
    setIsConnecting(true);
    try {
      const id =
        userId ||
        (await AsyncStore.getItem<string>(
          '@stream-rn-sampleapp-user-id',
          null,
        ));

      if (id) {
        const user = USERS[id];
        const userToken = USER_TOKENS[id];
        const client = new StreamChat<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >('q95x9hkbyd6p', {
          logger: (_type, _msg, extra) => {
            if ((extra?.tags as string[])?.indexOf('api_response') > -1) {
              // console.log(msg, extra);
            }
          },
          timeout: 6000,
        });

        await client.connectUser(user, userToken);
        await AsyncStore.setItem('@stream-rn-sampleapp-user-id', id);

        setChatClient(client);
      }
    } catch (e) {
      console.warn(e);
    }
    setIsConnecting(false);
  };

  useEffect(() => {
    switchUser();
  }, []);

  return {
    chatClient,
    isConnecting,
    switchUser,
  };
};
