import { useCallback, useEffect, useState } from 'react';

import type { StreamChat } from 'stream-chat';

import { useStableCallback } from '../../../hooks/useStableCallback';
import { OfflineDB } from '../../../store/OfflineDB';
import { SqliteClient, SqliteClientError } from '../../../store/SqliteClient';

export type InitializeOfflineDbOptions = {
  /**
   * Encrypts the offline database at rest with SQLCipher, using the key this resolves
   * to. Leaving it unset opens the database unencrypted, which is the default. See
   * `ChatProps.getOfflineDbEncryptionKey` for the build flag it requires, the stability
   * requirement, and how failures are surfaced.
   */
  getEncryptionKey?: () => Promise<string | undefined>;
};

export type UseInitializeOfflineDbParams = {
  client: StreamChat;
  /** Whether offline support is enabled at all. */
  enabled: boolean;
  options?: InitializeOfflineDbOptions;
  userID?: string;
};

/**
 * Attaches an offline database to the client and initializes it for a user.
 *
 * **Raises** whatever prevented the database from opening, from render, so an error
 * boundary above the caller can decide what to do. The offline database is never
 * silently downgraded, because an integration that asked for encryption must not end
 * up with an unencrypted cache.
 */
export const useInitializeOfflineDb = ({
  client,
  enabled,
  options,
  userID,
}: UseInitializeOfflineDbParams) => {
  /**
   * Why this attempt could not open the offline database.
   *
   * Held per attempt rather than read from a longer-lived source: a value that outlived
   * the attempt would be seen during the first render after a re-mount and raised
   * before that mount's own attempt could run, so an error boundary that re-mounts to
   * retry would loop forever.
   */
  const [initializationError, setInitializationError] = useState<SqliteClientError>();

  const { getEncryptionKey } = options ?? {};

  // `getEncryptionKey` is overwhelmingly likely to be an inline arrow. Stabilising it
  // keeps a new identity per render out of the dependencies below, while still calling
  // whatever the latest prop is.
  const resolveEncryptionKey = useStableCallback(
    () => getEncryptionKey?.() ?? Promise.resolve(undefined),
  );
  const isEncryptionEnabled = !!getEncryptionKey;

  const initialize = useCallback(async () => {
    if (!(userID && enabled)) {
      return;
    }

    if (!client.offlineDb) {
      const keyGetter = isEncryptionEnabled ? resolveEncryptionKey : undefined;

      // Confirm the database can be opened before attaching it: the client writes
      // through `client.offlineDb` without checking that it initialized, so one we
      // cannot open turns those writes into rejections (and UI is affected directly).
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

      client.setOfflineDBApi(new OfflineDB({ client, getEncryptionKey: keyGetter }));
    }

    const { offlineDb } = client;
    if (offlineDb) {
      await offlineDb.init(userID);
      // Note: Since `init()` currently swallows errors by design, we have to rely
      // on consuming the error later in order to be able to still rethrow without
      // introducing a breaking change.
      // TODO: The DB API should be changed in the next major to always throw upwards
      //       and let integrators handle it if necessary.
      setInitializationError(
        offlineDb instanceof OfflineDB ? offlineDb.initializationError : undefined,
      );
    }
  }, [client, enabled, isEncryptionEnabled, resolveEncryptionKey, userID]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializationError) {
    throw initializationError;
  }
};
