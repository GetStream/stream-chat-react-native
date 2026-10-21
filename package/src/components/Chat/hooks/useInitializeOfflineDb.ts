import { useCallback, useEffect, useState } from 'react';

import type { StreamChat } from 'stream-chat';

import { useStableCallback } from '../../../hooks/useStableCallback';
import { OfflineDB } from '../../../store/OfflineDB';
import { SqliteClient, SqliteClientError } from '../../../store/SqliteClient';

export type InitializeOfflineDbOptions = {
  /**
   * Resolves the key that encrypts the offline database at rest with SQLCipher; when unset the
   * database is unencrypted. See `ChatProps.getOfflineDbEncryptionKey` for the requirements.
   */
  getEncryptionKey?: () => Promise<string | undefined>;
  /**
   * Positive cap on the events of a single `/sync` response that the offline sync manager replays
   * into local storage; above it the replay is skipped. `false` removes the cap.
   */
  maxSyncEventsLimit?: number | false;
};

export type UseInitializeOfflineDbParams = {
  client: StreamChat;
  /** Whether offline support is enabled. */
  enabled: boolean;
  options?: InitializeOfflineDbOptions;
  userID?: string;
};

/**
 * Attaches an offline database to the client and initializes it for a user. Returns the attached
 * database, which is set after the first render.
 *
 * Throws from render whatever prevented the database from opening, so an error boundary above the
 * caller can handle it. The database is never silently downgraded to an unencrypted one.
 *
 * @param params.client The client to attach the database to.
 * @param params.enabled Whether offline support is enabled.
 * @param params.options Encryption key getter and sync event cap.
 * @param params.userID The user to initialize the database for.
 * @returns The attached database, or `undefined` when none is attached.
 * @throws The error that prevented the database from opening.
 */
export const useInitializeOfflineDb = ({
  client,
  enabled,
  options,
  userID,
}: UseInitializeOfflineDbParams) => {
  // Why this attempt could not open the offline database. Held per attempt: a longer-lived error
  // would be raised on the next mount before its own attempt runs, so an error boundary that
  // re-mounts to retry would loop forever.
  const [initializationError, setInitializationError] = useState<SqliteClientError>();
  const [offlineDb, setOfflineDb] = useState(() => client.offlineDb);

  const { getEncryptionKey, maxSyncEventsLimit } = options ?? {};

  // Keeps an inline `getEncryptionKey` from changing the dependencies below every render, while
  // still calling the latest prop.
  const resolveEncryptionKey = useStableCallback(
    () => getEncryptionKey?.() ?? Promise.resolve(undefined),
  );
  const isEncryptionEnabled = !!getEncryptionKey;

  const initialize = useCallback(async () => {
    if (!(userID && enabled)) {
      setOfflineDb(client.offlineDb);
      return;
    }

    if (!client.offlineDb) {
      const keyGetter = isEncryptionEnabled ? resolveEncryptionKey : undefined;

      // Confirm the database opens before attaching it: the client writes through
      // `client.offlineDb` without checking it initialized, so an unopenable one rejects those
      // writes.
      if (keyGetter) {
        SqliteClient.getEncryptionKey = keyGetter;
        try {
          await SqliteClient.preflightEncryption();
        } catch (error) {
          if (error instanceof SqliteClientError) {
            setInitializationError(error);
            return;
          }
          throw error;
        }
      }

      client.setOfflineDBApi(
        new OfflineDB({ client, getEncryptionKey: keyGetter, maxSyncEventsLimit }),
      );
    }

    const attachedOfflineDb = client.offlineDb;
    setOfflineDb(attachedOfflineDb);
    if (attachedOfflineDb) {
      await attachedOfflineDb.init(userID);
      // `init()` swallows errors by design, so the failure is read back from `initializationError`.
      // TODO: The DB API should be changed in the next major to always throw upwards
      //       and let integrators handle it if necessary.
      setInitializationError(
        attachedOfflineDb instanceof OfflineDB ? attachedOfflineDb.initializationError : undefined,
      );
    }
  }, [client, enabled, isEncryptionEnabled, maxSyncEventsLimit, resolveEncryptionKey, userID]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializationError) {
    throw initializationError;
  }

  return offlineDb;
};
