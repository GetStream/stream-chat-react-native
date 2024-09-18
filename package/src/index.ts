/** i18next polyfill to handle intl format for pluralization. For more info see https://www.i18next.com/misc/json-format#i-18-next-json-v4 */
import 'intl-pluralrules';

export * from './components';
export * from './hooks';
export { registerNativeHandlers, NetInfo, iOS14RefreshGallerySelection } from './native';
export * from './contexts';
export * from './emoji-data';

export * from './icons';

export * from './types/types';

export * from './utils/ACITriggerSettings';
export * from './utils/patchMessageTextCommand';
export * from './utils/i18n/Streami18n';
export * from './utils/queryMembers';
export * from './utils/queryUsers';
export * from './utils/utils';
export * from './utils/StreamChatRN';

export { default as enTranslations } from './i18n/en.json';
export { default as frTranslations } from './i18n/fr.json';
export { default as hiTranslations } from './i18n/hi.json';
export { default as itTranslations } from './i18n/it.json';
export { default as nlTranslations } from './i18n/nl.json';
export { default as ruTranslations } from './i18n/ru.json';
export { default as trTranslations } from './i18n/tr.json';
export { default as heTranslations } from './i18n/he.json';

export { QuickSqliteClient } from './store/QuickSqliteClient';
export { version } from './version.json';

import * as OfflineStoreApis from './store/apis';
export { OfflineStoreApis };
