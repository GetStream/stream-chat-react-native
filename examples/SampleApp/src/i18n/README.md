# Adding a language

This folder is the worked example for translating the Stream Chat React Native SDK. German and
Italian are here in full; copy either one to start a third.

From v10 the SDK ships **English only**. Every UI string carries its English copy inline at the
call site, so a language you do not translate still renders readable English rather than a raw
`dotted.key`. That also means adding a language is entirely additive — there is no locale file in
the SDK to fork or keep in sync.

## The four steps

### 1. Write the dictionary

```ts
// src/i18n/de.ts
import type { TranslationDictionary } from 'stream-chat-react-native';

export const de: TranslationDictionary = {
  'common.cancel.label': 'Abbrechen',
  'channelDetails.memberSection.title_one': '{{count}} Mitglied',
  'channelDetails.memberSection.title_other': '{{count}} Mitglieder',
};
```

Type it as `TranslationDictionary`. Keys are checked against the SDK's generated catalog, so a
typo — or a key that is renamed in a future release — is a compile error instead of a string that
silently stops applying.

**Partial dictionaries are safe.** Anything you leave out renders its English copy. You can ship
one screen at a time.

To see every key with its English copy:

```bash
yarn workspace stream-chat-react-native-core i18n:export
```

### 2. Register the dayjs locale **and its calendar wording**

```ts
import 'dayjs/locale/de';
```

Only the `en` dayjs locale is bundled. Without this import the strings translate but every
timestamp, month name and numeric date stays English.

The import alone is not enough, though. dayjs locale files carry month and day names but **no
`calendar` block** — that field belongs to the calendar plugin, and no locale ships one, `en`
included. Miss it and relative dates render the plugin's English scaffolding wrapped around a
correctly translated day name:

> Last **Mittwoch** at 5:10 PM

So pass the calendar wording too, as `registerTranslation`'s third argument:

```ts
streami18n.registerTranslation('de', de, {
  calendar: {
    lastDay: '[Gestern]',
    lastWeek: 'dddd',
    nextDay: '[Morgen]',
    nextWeek: 'dddd [um] LT',
    sameDay: '[Heute]',
    sameElse: 'L',
  },
});
```

Bracketed text is literal; `dddd`, `LT` and `L` are dayjs tokens. `sameElse: 'L'` keeps the
locale's own numeric format (`14.07.2026` for German). The config is merged into the locale, so
supplying only `calendar` leaves everything `dayjs/locale/de` gave you intact.

`dayjsLocaleConfigForLanguage` on the constructor does the same thing for the initial language,
and a fully preconfigured `DateTimeParser` is accepted if you would rather own dayjs yourself.

### 3. Create the instance once and register

```ts
export const streami18n = new Streami18n({ language: 'en' });

streami18n.registerTranslation('de', de);
streami18n.registerTranslation('it', it);
```

Module scope, not a component body — see the note in [`index.ts`](./index.ts).

`registerTranslation` **merges**, so calling it repeatedly for one language accumulates, and a
partial dictionary can never knock out the SDK's bundled timestamp formats.

### 4. Pass it to `Chat` / `OverlayProvider` and switch at runtime

```tsx
<OverlayProvider i18nInstance={streami18n}>
  <Chat client={client} i18nInstance={streami18n}>
```

```ts
await streami18n.setLanguage('de');
```

`setLanguage` swaps the active language on the live instance and notifies listeners, so the tree
re-renders. You do not need to remount `<Chat>` or build a new `Streami18n`.

In this app the switcher lives in the drawer's secret menu — open the drawer, tap your own name at
the top of it seven times, then pick a language under **Language**.

## Three things that catch people out

### Plurals are separate keys, not a syntax

`<key>_one` and `<key>_other`, selected by `Intl.PluralRules`:

```ts
'poll.votes.text_one': '{{count}} Stimme',
'poll.votes.text_other': '{{count}} Stimmen',
```

Languages with more categories can add `_zero`, `_two`, `_few` and `_many` and stay type-checked.
Supply only the categories your language actually uses; the rest fall back to the English copy.

### Two timestamp keys carry English day names _inside_ the format

`timestamp.ChannelPreviewStatus` and `timestamp.ThreadListItem` embed their own `calendarFormats`,
which **replaces** the dayjs locale's calendar wholesale — so step 2 does not reach them. They are
the only date keys you must translate by hand:

```ts
'timestamp.ChannelPreviewStatus':
  '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Gestern]", "lastWeek":"dddd", "nextDay":"[Morgen]", "nextWeek":"dddd [um] LT", "sameDay":"LT", "sameElse":"L"}) }}',
```

Only the bracketed literals change. `dddd`, `LT` and `L` are dayjs format tokens, and everything
after the `|` is a formatter expression — leave both alone.

`timestamp.UserActivityStatus` is the third date key with prose in it (`Last seen …`). The
remaining `timestamp.*` keys are pure formatter expressions that the dayjs locale already handles,
which is why neither [`de.ts`](./de.ts) nor [`it.ts`](./it.ts) lists them.

### Placeholders must survive translation

`{{count}}`, `{{ user }}` and pipe expressions like `{{ timestamp | fromNowFormatter }}` are
matched by name. Reorder them within the sentence as the grammar needs, but never rename, add or
drop one, and never translate anything after a `|`.

## Your own strings

`TranslationDictionary` only accepts the SDK's keys. To keep app-owned copy in the same instance,
widen the annotation:

```ts
import type { LooseTranslationDictionary } from 'stream-chat-react-native';

const appStrings: LooseTranslationDictionary = {
  'myApp.welcome.title': 'Willkommen',
};
```

The trade-off is real: `LooseTranslationDictionary` no longer catches a stale or mistyped SDK key,
so keep app strings in a separate object from the SDK ones.
