import type { StreamChat } from 'stream-chat';

type Params = {
  client: StreamChat;
  enableOfflineSupport: boolean;
  initialisedDatabase: boolean;
};

/**
 * @deprecated
 * With the recent rework of the Offline Support feature, the handling of events has been moved
 * to the stream-chat client instead of the SDK. This hook now does nothing and you can safely
 * remove it from your code if you were using it. It will be removed in the next major release.
 * @param client
 * @param initialisedDatabase
 */
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSyncDatabase = ({ client, initialisedDatabase }: Params) => {};
