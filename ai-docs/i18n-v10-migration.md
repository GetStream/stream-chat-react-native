# i18n changes in v10

Two breaking changes, both in v10:

1. **English is the only bundled language.** The `ar`, `es`, `fr`, `he`, `hi`, `it`, `ja`, `ko`, `nl`, `pt-br`, `ru` and
   `tr` dictionaries are gone, along with their per-locale `dayjs` calendar formats.
2. **Translation keys are stable dotted identifiers**, not the English text. `t('Send Message')` became
   `t('messageInput.sendMessage.accessibilityLabel')`, and prose keys carry their English copy inline as i18next's
   `defaultValue`: `t('message.reply.label', 'Reply')`.

Metro does not tree-shake, so before this every app paid for all 12 non-English locales even when it only ever rendered
English. Measured on this branch, `.js` and `.json` in each build target concatenated then `gzip -9`:

| Target         | Before  | After   | Saved   |
| -------------- | ------- | ------- | ------- |
| `lib/commonjs` | 498,708 | 427,743 | −70,965 |
| `lib/module`   | 499,091 | 426,942 | −72,149 |

The 13 JSON files were 392,103 raw / 70,972 gzip and shipped in both targets. What replaces them is
`runtimeDefaults.js` at 8,013 raw / 1,977 gzip; `keys.js` compiles to 33 bytes — a sourcemap comment — so the
408-entry typed catalog costs nothing at runtime.

## Why the keys changed at all

The old keys _were_ the English copy, which meant:

- A copy edit silently orphaned every translation, because the key changed with the text.
- The same word in different contexts could not be disambiguated. The codebase had already grown ad-hoc `a11y/`,
  `mention/`, `timestamp/` and `duration/` prefixes to work around exactly this.

Keys are now stable, and the English copy travels inline at the call site as i18next's `defaultValue`. A key you do not
supply still renders English rather than a raw dotted path.

The exception is the 97 keys that carry no inline copy. They reach `t()` as runtime values — a JSX prop, a ternary
branch, a lookup table keyed by something other than the copy — so there is no call site at which a default could be
written. Those live in `runtimeDefaults` (`package/src/i18n/runtimeDefaults.ts`), and both `registerTranslation()` and
`translationsForLanguage` merge your dictionary over them, so you inherit the working defaults without listing them.

## Do I need to do anything?

| If you…                                       | Action                                          |
| --------------------------------------------- | ----------------------------------------------- |
| use the SDK in English and never touched i18n | **Nothing.**                                    |
| passed `translationsForLanguage`              | Rename your keys — see below                    |
| called `registerTranslation()`                | Rename your keys — see below                    |
| used a built-in non-English language          | Supply the dictionary yourself — see below      |
| relied on non-English date formats            | Import the `dayjs` locale yourself — see below  |
| imported `enTranslations` … `trTranslations`  | Those exports are removed — supply your own     |

**Renaming is not optional and it fails quietly.** An old key simply never matches, so your override stops applying and
the English copy renders instead — no error. Typing the dictionary as `TranslationDictionary` turns that silent failure
into a compile error.

## Overriding some English copy

Anything not mentioned is untouched.

```tsx
import { Chat, Streami18n, type TranslationDictionary } from 'stream-chat-react-native';

const i18n = new Streami18n({
  translationsForLanguage: {
    'autoCompleteInput.placeholder': 'Write something…',
    'message.deleteMessageConfirm.text': 'Delete this message for everyone?',
  } satisfies TranslationDictionary,
});

<Chat client={client} i18nInstance={i18n}>
  …
</Chat>;
```

On Expo the import is the only difference:

```tsx
import { Chat, Streami18n, type TranslationDictionary } from 'stream-chat-expo';
```

Keys are checked against the generated catalog, so a typo or a leftover v9 key is a compile error rather than an
override that silently never applies:

```ts
const overrides: TranslationDictionary = {
  'autoCompleteInput.placeholder': 'Write something…',
  'Send a message': 'Write something…', // ← v9 key: compile error, exactly what you want here
};
```

## Registering a new language

`registerTranslation(language, translation, customDayjsLocale?)` **merges** over the bundled defaults instead of
replacing them, so repeated calls for one language accumulate and a partial dictionary cannot knock out timestamps.

```ts
import { Streami18n, type TranslationDictionary } from 'stream-chat-react-native';
import 'dayjs/locale/de';

const de: TranslationDictionary = {
  'common.cancel.label': 'Abbrechen',
  'common.you.label': 'Du',
  'message.reply.label': 'Antworten',
  'message.deleteMessage.label': 'Nachricht löschen',
  'messageList.unreadMessages.label': 'Ungelesene Nachrichten',
  'channelDetails.memberSection.title_one': '{{count}} Mitglied',
  'channelDetails.memberSection.title_other': '{{count}} Mitglieder',
};

const i18n = new Streami18n({ language: 'de' });
i18n.registerTranslation('de', de, {
  calendar: {
    lastDay: '[gestern um] LT',
    lastWeek: '[letzten] dddd [um] LT',
    nextDay: '[morgen um] LT',
    nextWeek: 'dddd [um] LT',
    sameDay: '[heute um] LT',
    sameElse: 'L',
  },
});
```

### Fallback behaviour

A partial dictionary is safe. Given the `de` dictionary above:

| Key                                       | Renders                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `common.cancel.label`                     | `Abbrechen` — supplied                                                         |
| `attachment.unsupported.title`            | `Unsupported Attachment` — the inline English default at the call site         |
| `messageInput.sendMessage.accessibilityLabel` | `Send message` — from the bundled `runtimeDefaults`                        |
| `timestamp.MessageTimestamp`              | a formatted time — from the bundled `runtimeDefaults`                          |

No key ever renders as a raw dotted path. Selecting a language nobody registered is not an error either: the SDK logs
one warning and renders its English copy while keeping that language's date formats.

### Recovering a dictionary the SDK used to ship

The last published dictionaries are in git history:

```bash
git show v9.7.6:package/src/i18n/nl.json > nl.json
```

Its keys are the _old_ natural-language keys, so it needs the same rename as your own overrides — see
[the key table](#the-oldnew-key-table).

## Plurals

Plurals live in the catalog as `<key>_one` / `<key>_other`. Call sites use the bare key and pass `count`; the suffixed
forms are never referenced directly.

```ts
// inside the SDK
t('channelDetails.memberSection.title', { count: members.length });
// -> '1 member' / '4 members'
```

`TranslationDictionary` accepts every category `Intl.PluralRules` can select, so Arabic, Hebrew and Russian can supply
`_zero`, `_few` and `_many` and stay type-checked. A plural suffix on a key that is not plural is rejected.

```ts
const ru: TranslationDictionary = {
  'channelDetails.memberSection.title_one': '{{count}} участник',
  'channelDetails.memberSection.title_few': '{{count}} участника',
  'channelDetails.memberSection.title_many': '{{count}} участников',
  'messageMenu.userReactions.title_one': '{{count}} реакция',
  'messageMenu.userReactions.title_few': '{{count}} реакции',
  'messageMenu.userReactions.title_many': '{{count}} реакций',
};
```

Do **not** key a dictionary on `Partial<Record<TranslationKey, string>>`. `TranslationKey` is the set `t()` accepts,
where a plural is the bare `<key>`; a dictionary needs the `_one` / `_other` entries, which that type rejects.
`TranslationDictionary` already handles this.

## Date and time

Two steps, and the second is the one that gets missed.

### Step 1 — the dayjs locale

Only the `en` dayjs locale is bundled. Import your own **and** pass `dayjsLocaleConfigForLanguage`. Both halves are
required: `calendar` is not part of dayjs's own `ILocale` — it comes from the calendar plugin — and **no dayjs locale
file defines it**, `en` included. Import `dayjs/locale/de` on its own and you get German month and day names, but every
relative date renders the plugin's built-in English scaffolding around a translated day name:

> Last **Mittwoch** at 5:10 PM

The SDK applies its own `calendar` block to `en` internally for exactly this reason. That the field is plugin-owned is
also why `DayjsLocaleConfig` is exported: typing the argument as a bare `Partial<ILocale>` makes passing a calendar
config a TS2345 "no properties in common" error.

```ts
import { Streami18n, type DayjsLocaleConfig } from 'stream-chat-react-native';
import 'dayjs/locale/de';

const deLocale: DayjsLocaleConfig = {
  calendar: {
    lastDay: '[gestern um] LT',
    lastWeek: '[letzten] dddd [um] LT',
    nextDay: '[morgen um] LT',
    nextWeek: 'dddd [um] LT',
    sameDay: '[heute um] LT',
    sameElse: 'L',
  },
};

const i18n = new Streami18n({ language: 'de', dayjsLocaleConfigForLanguage: deLocale });
```

Or pass your own preconfigured `DateTimeParser` (dayjs or moment) with the locales already loaded — in which case the
calendar wording is yours to apply too, via `Dayjs.updateLocale`:

```ts
import Dayjs from 'dayjs';
import 'dayjs/locale/nl';

const i18n = new Streami18n({ language: 'nl', DateTimeParser: Dayjs });
```

Set `disableDateTimeTranslations: true` to keep dates in English regardless of language.

### Step 2 — the two `timestamp.*` keys with their own `calendarFormats`

**This is the single easiest thing to miss.** A fully configured German app still renders "Yesterday" in its channel
list until you do this.

Two bundled keys pass their own `calendarFormats` argument, with English day words baked in:

| Key                              | Rendered where                     |
| -------------------------------- | ---------------------------------- |
| `timestamp.ChannelPreviewStatus` | the timestamp on a channel preview |
| `timestamp.ThreadListItem`       | the timestamp on a thread list row |

A per-key `calendarFormats` replaces the locale's calendar **wholesale**: `getDateString` short-circuits to `t()` before
the dayjs calendar path, and `timestampFormatter` then parses the calendar config out of the translation value itself.
`dayjsLocaleConfigForLanguage` therefore never reaches them. Translating them means overriding the two keys.

Copy-pasteable German:

```ts
import { Streami18n, type TranslationDictionary } from 'stream-chat-react-native';

const deTimestamps: TranslationDictionary = {
  'timestamp.ChannelPreviewStatus':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Gestern]", ' +
    '"lastWeek":"dddd", "nextDay":"[Morgen]", "nextWeek":"dddd [um] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.ThreadListItem':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Gestern]", ' +
    '"lastWeek":"dddd", "nextDay":"[Morgen]", "nextWeek":"dddd [um] LT", "sameDay":"LT", "sameElse":"L"}) }}',
};

i18n.registerTranslation('de', { ...de, ...deTimestamps }, deLocale);
```

The English originals are in `package/src/i18n/runtimeDefaults.ts`; the `calendarFormats` object is parsed as JSON, so
keep it valid JSON with double quotes. Adding a third such key fails a guard in
`package/src/utils/__tests__/Streami18n.test.ts` that exists to keep this section honest.

One more formatter key carries English outside its expression:
`timestamp.UserActivityStatus` is `'Last seen {{ timestamp | fromNowFormatter }}'`. Override it the same way to
translate "Last seen". The other eight `timestamp.*` / `duration.*` entries are pure expressions — override one only to
change _how_ a date is formatted, never to translate it.

## Custom keys of your own

`registerTranslation()` and `translationsForLanguage` take the strict `TranslationDictionary`, so a key typed inline is
checked against the catalog. To carry your app's own copy on the same `Streami18n` instance, annotate the **variable**
you pass as `LooseTranslationDictionary` — that is the intended escape hatch, and it is why the strict type is on the
parameter rather than on the dictionary you declare:

```ts
import type { LooseTranslationDictionary } from 'stream-chat-react-native';

i18n.registerTranslation('de', { 'common.cancel.lable': 'Abbrechen' }); // ← compile error: typo

const withOwnKeys: LooseTranslationDictionary = {
  'common.cancel.label': 'Abbrechen',
  'myApp.settings.title': 'Einstellungen',
};
i18n.registerTranslation('de', withOwnKeys); // ← fine
```

Nothing catches a mistyped or stale SDK key inside a `LooseTranslationDictionary` — it compiles, and then never matches
at runtime. Extra plural categories do **not** need it; `TranslationDictionary` already accepts `_zero` / `_few` /
`_many`.

Reading one of your own keys back needs the same deliberate widening, because the SDK's `t` only accepts catalog keys:

```tsx
import { Text } from 'react-native';
import { asDynamicKey, useTranslationContext } from 'stream-chat-react-native';

const MySettingsHeader = () => {
  const { t } = useTranslationContext();
  return <Text>{t(asDynamicKey('myApp.settings.title'), 'Settings')}</Text>;
};
```

`asDynamicKey` brands a plain string as a `DynamicTranslationKey`, so the escape hatch has to be taken explicitly and
every site that takes it is greppable.

## Keeping a language up to date across SDK upgrades

When a later release adds a key, **your build stays green.** `TranslationDictionary` is `Partial`, so nothing is
required; the new string renders its inline English until you translate it. That is deliberate — a partial dictionary is
always safe — but it does mean new copy arrives untranslated without telling you.

To be told, diff your dictionary against the catalog at the type level. Declare it `as const` so TypeScript keeps the
literal keys, then `Exclude` them from `TranslationCatalog`:

```ts
import type { TranslationCatalog, TranslationDictionary } from 'stream-chat-react-native';

export const de = {
  'common.cancel.label': 'Abbrechen',
  'common.you.label': 'Du',
  'message.reply.label': 'Antworten',
} as const satisfies TranslationDictionary;

/** Every key still needing German. Hover it to read the list. */
type Untranslated = Exclude<keyof TranslationCatalog, keyof typeof de>;
```

Hovering `Untranslated` in your editor lists the missing keys, and it shrinks as you add them. To turn "am I complete?"
into a build failure — useful in CI after a dependency bump — assert the diff is empty:

```ts
type AssertEmpty<T extends never> = T;
type TranslationsComplete = AssertEmpty<Untranslated>;
// ^ compile error naming a missing key until `de` covers the whole catalog
```

`satisfies` is doing real work here: it still type-checks every key against the catalog (so a typo is an error) while
`as const` preserves the literal keys that `keyof typeof de` needs. A plain `: TranslationDictionary` annotation would
widen `keyof typeof de` to the whole catalog and the diff would always be empty.

Two caveats:

- `TranslationCatalog` is a type, which is what keeps the typed surface free at runtime. The check is compile-time
  only; a script cannot ask the installed package "which keys exist?".
- Extra plural categories are accepted by `TranslationDictionary` but are not catalog keys, so they neither break the
  `satisfies` check nor shrink the diff.

### Handing the catalog to a translator

There is deliberately no checked-in `en.json` — the copy lives inline at each `t()` call site, so a committed catalog
would be a duplicate that can go stale. Generate one from a clone:

```bash
yarn workspace stream-chat-react-native-core i18n:export
```

That writes `package/en.json` with the 397 translatable keys. The 11 `timestamp.*` and `duration.*` entries are left
out on purpose — they are dayjs and i18next expressions, and a TMS that "translates" `{{ timestamp |
timestampFormatter(...) }}` breaks date rendering outright. Pass `--all` for the complete 408-key catalog.

## The old→new key table

Every old key maps to exactly one new key. The full table (391 rows) is
[`i18n-v10-key-map.json`](./i18n-v10-key-map.json). Keys absent from it were dead in v9 and have been removed.

Shape — `key` is the replacement, `prose` is `false` for the formatter expressions, and `plural` marks the keys that
live in the catalog as `_one` / `_other`:

```json
{
  "count": 391,
  "keys": {
    "Cancel": { "key": "common.cancel.label", "prose": true, "plural": false },
    "{{count}} Reactions": { "key": "messageMenu.userReactions.title", "prose": true, "plural": true },
    "timestamp/ChannelPreviewStatus": {
      "key": "timestamp.ChannelPreviewStatus",
      "prose": false,
      "plural": false
    }
  }
}
```

Fifteen representative rows:

| v9 key                                                      | v10 key                                         |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `Cancel`                                                     | `common.cancel.label`                           |
| `You`                                                        | `common.you.label`                              |
| `Send a message`                                             | `autoCompleteInput.placeholder`                 |
| `Reply`                                                      | `message.reply.label`                           |
| `Delete Message`                                             | `message.deleteMessage.label`                   |
| `Are you sure you want to permanently delete this message?`  | `message.deleteMessageConfirm.text`             |
| `Only visible to you`                                        | `attachment.giphy.onlyVisibleToYou.text`        |
| `Unread Messages`                                            | `messageList.unreadMessages.label`              |
| `Loading channels...`                                        | `indicators.loading.channels.text`              |
| `Error while loading, please reload/refresh`                 | `channelList.header.loadFailed.error`           |
| `Failed to load media`                                       | `channelDetails.mediaList.load.error`           |
| `a11y/Send message`                                          | `messageInput.sendMessage.accessibilityLabel`   |
| `a11y/{{count}} unread messages`                             | `channelPreview.unreadCount.accessibilityLabel` |
| `mention/Channel Description`                                | `autoCompleteInput.mention.channel.description` |
| `timestamp/ChannelPreviewStatus`                             | `timestamp.ChannelPreviewStatus`                |

Keys are namespaced after the source tree, so they are predictable from the component: `message.*`, `messageInput.*`,
`messageList.*`, `channelDetails.*`, `poll.*`, `attachmentPicker.*`, with genuinely shared copy under `common.*`. The
last segment is the modality: `.label`, `.title`, `.text`, `.placeholder`, `.description`, `.error`,
`.accessibilityLabel`. The `timestamp.*` and `duration.*` leaf stays PascalCase after the consuming component, matching
the `timestamp/<Component>` keys it replaces.

## Type reference

| Type                          | Use it for                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `TranslationDictionary`       | the dictionary you register — SDK keys only, plural suffixes included               |
| `LooseTranslationDictionary`  | the same, plus your app's own keys; nothing catches a stale SDK key here            |
| `TranslationKey`              | typing a `t` parameter; a plural appears as the bare key, so not a dictionary type   |
| `TranslationCatalog`          | every key mapped to its English copy — type-only, adds nothing to the bundle        |
| `StreamTFunction`             | the SDK's `t`, as returned by `useTranslationContext()`                             |
| `DayjsLocaleConfig`           | `dayjsLocaleConfigForLanguage` and `registerTranslation`'s third argument            |
| `CalendarFormats`             | the six calendar slots inside a `DayjsLocaleConfig`                                  |
| `DynamicTranslationKey`       | a key only known at runtime; brand one with `asDynamicKey()`                         |

All of them are exported from `stream-chat-react-native` and `stream-chat-expo`.
