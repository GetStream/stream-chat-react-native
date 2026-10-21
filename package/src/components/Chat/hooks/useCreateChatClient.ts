import { useEffect, useState } from 'react';

import { StreamChat } from 'stream-chat';

import type { ClientUser, DeepPartial, InstanceConfigTree, TokenOrProvider } from 'stream-chat';

import { netInfoStatusReporter } from './useConnectionLifecycle';

/**
 * Names the NetInfo reporter in the client options, so network status is reported from
 * construction. `<Chat>` installs it only from an effect, and until then the client mirrors its own
 * WebSocket, which records a socket-only failure (expired token, server close) as the device being
 * offline. A `statusReporter` in `options` wins.
 */
const withNetInfoReporter = (
  options?: DeepPartial<InstanceConfigTree>,
): DeepPartial<InstanceConfigTree> => ({
  ...options,
  client: {
    ...options?.client,
    networkConnection: {
      statusReporter: netInfoStatusReporter,
      ...options?.client?.networkConnection,
    },
  },
});

/**
 * Creates a `StreamChat` client and connects the user. Disconnects the user when the inputs change
 * or the component unmounts.
 *
 * @param params.apiKey The Stream API key.
 * @param params.options Client configuration. Only the first value is used.
 * @param params.tokenOrProvider The user token or a function that provides it.
 * @param params.userData The user to connect. A new connection is made only when its `id` changes.
 * @returns The client once the user is connected, otherwise `null`.
 */
export const useCreateChatClient = ({
  apiKey,
  options,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  /** The user to connect, as `client.connectUser` accepts it. Only `id` is required. */
  userData: ClientUser;
  options?: DeepPartial<InstanceConfigTree>;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [cachedUserData, setCachedUserData] = useState(userData);

  if (userData.id !== cachedUserData.id) {
    setCachedUserData(userData);
  }

  const [cachedOptions] = useState(options);

  useEffect(() => {
    const client = new StreamChat(apiKey, withNetInfoReporter(cachedOptions));
    let didUserConnectInterrupt = false;

    const connectionPromise = client.connectUser(cachedUserData, tokenOrProvider).then(() => {
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
          console.log(`Connection for user "${cachedUserData.id}" has been closed`);
        });
    };
  }, [apiKey, cachedUserData, cachedOptions, tokenOrProvider]);

  return chatClient;
};
