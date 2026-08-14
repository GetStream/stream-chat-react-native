export const DB_NAME = 'stream-chat-react-native';
export const DB_LOCATION = 'databases';
export const DB_STATUS_ERROR = 1;

/**
 * Default value for the `maxSyncEventsLimit` prop on `Chat`. Chosen conservatively
 * and below the backend hard cap; tune with performance data. The underlying LLC
 * (`stream-chat`) has no default of its own, this default is implied purely by the
 * RN SDK.
 */
export const DEFAULT_MAX_SYNC_EVENTS_LIMIT = 250;
