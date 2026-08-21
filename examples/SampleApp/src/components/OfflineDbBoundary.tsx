import React from 'react';

import {
  SqliteClient,
  SqliteClientError,
  type SqliteClientErrorCode,
} from 'stream-chat-react-native';

/**
 * `<Chat>` throws a {@link SqliteClientError} from render when it cannot open the
 * offline database - most often `OFFLINE_DB_UNREADABLE`, meaning the file on disk
 * cannot be read (corruption, or a database left behind from a different encryption
 * mode). It never silently continues without the cache; recovery is the application's
 * decision.
 *
 * The recommended recovery, shown here: the contents are a cache, so delete the
 * database and let it rebuild from the server. The only real loss is actions that were
 * queued while offline, so a real app may want to confirm with the user first.
 *
 * The `onGiveUp` path covers the codes that mean "no usable encryption key"
 * (`SQLCIPHER_BUILD_MISSING`, `ENCRYPTION_KEY_UNAVAILABLE`). Those only occur when
 * `<Chat>` is given a `getOfflineDbEncryptionKey` prop, which this sample does not do -
 * a new database would then be written in plaintext, so running online-only is the safe
 * response.
 */
type BoundaryProps = React.PropsWithChildren<{
  onGiveUp: () => void;
  onRetry: () => void;
}>;

type BoundaryState = { code?: SqliteClientErrorCode };

export class OfflineDbBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {};

  // Must return state, and render() must stop rendering the failing subtree. Returning
  // null here would re-render the same children, they would throw again, and React
  // would give up and unmount the whole app.
  static getDerivedStateFromError(error: unknown) {
    if (!(error instanceof SqliteClientError)) {
      // Not one of ours - re-throw so it reaches whatever boundary owns it.
      throw error;
    }
    return { code: error.code };
  }

  componentDidCatch(error: unknown) {
    if (!(error instanceof SqliteClientError)) {
      return;
    }

    if (error.code === 'OFFLINE_DB_UNREADABLE') {
      // The recommended recovery: the contents are a cache, so drop the database and
      // let it rebuild. Only actions queued while offline are lost.
      try {
        SqliteClient.deleteDatabase();
      } catch (deleteError) {
        console.warn('[SampleApp] could not delete the offline database', deleteError);
      }
      this.props.onRetry();
      return;
    }

    // No usable key, so a new database would be plaintext. Run online-only instead.
    console.warn(`[SampleApp] offline encryption unavailable (${error.code}); going online-only`);
    this.props.onGiveUp();
  }

  render() {
    return this.state.code ? null : this.props.children;
  }
}
