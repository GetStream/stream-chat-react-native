// Registers the locales with dayjs. The SDK bundles only `en`, so without these two side-effect
// imports every date and relative time would keep rendering in English even with the dictionaries
// below installed. `Streami18n` looks the language up in dayjs's global registry, so importing is
// the whole integration — there is nothing to pass.
import 'dayjs/locale/de';
import 'dayjs/locale/it';

import { Streami18n } from 'stream-chat-react-native';

import { de } from './de';
import { it } from './it';

import AsyncStore from '../utils/AsyncStore';

/**
 * The SampleApp's i18n setup, and the reference for adding a language to your own app.
 *
 * See ./README.md for the walkthrough.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const LANGUAGE_STORAGE_KEY = '@stream-rn-sampleapp-language';

/**
 * Module scope, deliberately: one instance for the process lifetime.
 *
 * Constructing `Streami18n` inside a component body makes a new instance on every render, which
 * throws away the registered dictionaries and remounts the translation context.
 *
 * `en` needs no dictionary — the SDK's English copy ships inline with each key.
 */
export const streami18n = new Streami18n({ language: 'en' });

/**
 * Calendar wording, which the dayjs locale files do **not** carry.
 *
 * `dayjs/locale/de` gives you German month and day names, but no `calendar` block — that field
 * belongs to the calendar plugin, and no locale defines it. Without the configs below, a relative
 * date renders the plugin's built-in English scaffolding around a translated day name:
 * "Last Mittwoch at 5:10 PM". The SDK does the same thing for `en` internally.
 *
 * `sameElse: 'L'` keeps the locale's own numeric date format (14.07.2026 for de).
 */
const deCalendar = {
  lastDay: '[Gestern]',
  lastWeek: 'dddd',
  nextDay: '[Morgen]',
  nextWeek: 'dddd [um] LT',
  sameDay: '[Heute]',
  sameElse: 'L',
};

const itCalendar = {
  lastDay: '[Ieri]',
  lastWeek: 'dddd',
  nextDay: '[Domani]',
  nextWeek: 'dddd [alle] LT',
  sameDay: '[Oggi]',
  sameElse: 'L',
};

streami18n.registerTranslation('de', de, { calendar: deCalendar });
streami18n.registerTranslation('it', it, { calendar: itCalendar });

/**
 * Applies the language the user last picked.
 *
 * `setLanguage` swaps the language on the live instance and notifies its listeners, so the tree
 * re-renders — no remount of `<Chat>` and no second `Streami18n`.
 */
export const restoreSavedLanguage = async () => {
  const saved = await AsyncStore.getItem<SupportedLanguageCode | null>(LANGUAGE_STORAGE_KEY, null);

  if (saved && saved !== streami18n.currentLanguage) {
    await streami18n.setLanguage(saved);
  }
};
