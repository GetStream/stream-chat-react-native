import { registerNativeHandlers } from 'stream-chat-react-native-core';

export * from 'stream-chat-react-native-core';

/**
 * The default native handlers this package registers with the core SDK.
 *
 * Exposed so integrators can compose or wrap a single handler (for example to
 * force `takePhoto` to capture images only) without reimplementing it or
 * reaching into internal module paths. Register your override *after* importing
 * this package so it takes precedence.
 *
 * Example:
 *
 * ```ts
 * import { registerNativeHandlers, defaultNativeHandlers } from 'stream-chat-expo';
 *
 * const localTakePhoto = defaultNativeHandlers.takePhoto;
 *
 * registerNativeHandlers({
 *   takePhoto: localTakePhoto
 *     ? (options) => {
 *         console.log('[#3379 demo] wrapped takePhoto — forcing mediaType "image"', options);
 *         return localTakePhoto({ ...options, mediaType: 'image' });
 *       }
 *     : undefined,
 * });
 * ```
 */
export declare const defaultNativeHandlers: Parameters<typeof registerNativeHandlers>[0];
