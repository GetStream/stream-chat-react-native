/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
import './polyfills';

export * from './components';
export * from './hooks';
export {
  PickImageOptions,
  PlaybackStatus,
  RecordingStatus,
  registerNativeHandlers,
  SoundReturnType,
} from './native';
export * from './contexts';

export * from './icons';

export * from './middlewares';

export * from './types/types';

export * from './utils/patchMessageTextCommand';
export * from './utils/i18n/Streami18n';
export * from './i18n';
export * from './utils/setupCommandUIMiddlewares';
export * from './utils/createGenerateVideoThumbnails';
export * from './utils/utils';
export * from './nativeMultipartUpload';

export * from './state-store';
export { SqliteClient } from './store/SqliteClient';
export { OfflineDB } from './store/OfflineDB';
export { version } from './version.json';

import { NativeHandlers } from './native';
import * as OfflineStoreApis from './store/apis';
export { OfflineStoreApis };

export const iOS14RefreshGallerySelection = NativeHandlers.iOS14RefreshGallerySelection;
