/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';
import './polyfills';

export * from './components';
export * from './hooks';
export { registerNativeHandlers, SoundReturnType, PlaybackStatus, RecordingStatus } from './native';
export * from './contexts';

export * from './icons';

export * from './middlewares';

export * from './types/types';

export * from './utils/patchMessageTextCommand';
export * from './utils/i18n/Streami18n';
export * from './utils/setupCommandUIMiddlewares';
export * from './utils/utils';

export { default as enTranslations } from './i18n/en.json';
export { default as frTranslations } from './i18n/fr.json';
export { default as hiTranslations } from './i18n/hi.json';
export { default as itTranslations } from './i18n/it.json';
export { default as nlTranslations } from './i18n/nl.json';
export { default as ruTranslations } from './i18n/ru.json';
export { default as trTranslations } from './i18n/tr.json';
export { default as heTranslations } from './i18n/he.json';

export { SqliteClient } from './store/SqliteClient';
export { OfflineDB } from './store/OfflineDB';
export { version } from './version.json';

import { NativeHandlers } from './native';
import * as OfflineStoreApis from './store/apis';
export { OfflineStoreApis };

export const iOS14RefreshGallerySelection = NativeHandlers.iOS14RefreshGallerySelection;
