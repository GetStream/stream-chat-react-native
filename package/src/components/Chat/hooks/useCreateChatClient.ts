import { useEffect, useState } from 'react';

import { StreamChat } from 'stream-chat';

import type {
  OwnUserResponse,
  StreamChatOptions,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

import { netInfoStatusReporter } from './useIsOnline';

/**
 * Names the NetInfo reporter in the client's own options, so the device's network status is reported
 * from the moment the client exists.
 *
 * `<Chat>` also installs it, but only from an effect — and until something reports, the client falls
 * back to a reporter that mirrors its own WebSocket. That fallback cannot distinguish "this device
 * has no network" from "this socket died", so a socket-only failure in that window (an expired
 * token, a server close, the `closeConnection()` that backgrounding uses) is recorded as the device
 * being offline, and the UI blames the network for it. Installing here means the fallback is never
 * reached.
 *
 * A `statusReporter` the caller passed themselves wins — it is spread last.
 */
const withNetInfoReporter = (options?: StreamChatOptions): StreamChatOptions => ({
  ...options,
  config: {
    ...options?.config,
    client: {
      ...options?.config?.client,
      networkConnection: {
        statusReporter: netInfoStatusReporter,
        ...options?.config?.client?.networkConnection,
      },
    },
  },
});

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
