# Task: port the v15 i18n architecture from `stream-chat-react` to `stream-chat-react-native`

You are working in `stream-chat-react-native`. Your job is to replace this SDK's i18n system with
the architecture already shipped in the React (web) SDK, so that both SDKs behave identically and,
wherever the two SDKs render the same concept, **use the same translation key**.

This is a port, not a redesign. The design decisions below are settled — they were made, reviewed
and shipped in the web SDK. Do not re-litigate them. Where the RN platform genuinely forces a
deviation, implement the deviation and record it in a `## Deviations` section of your PR
description.

---

## 1. The reference implementation — read it first

The web implementation is on branch `sdk-i18n-refactor-8925a7` (PR #3261, targeting `release-v15`)
in the sibling repo `../stream-chat-react`, at commit `4cf2e6cbf`.

Read these before writing any code. They are the specification; this document is only a summary.

| File | What it defines |
| --- | --- |
| `src/i18n/types.ts` | The whole exported type surface (copy it near-verbatim) |
| `src/i18n/keys.ts` | Generated catalog — read the shape, never hand-edit |
| `src/i18n/runtimeDefaults.ts` | The only translation data that ships |
| `src/i18n/externalStrings.ts` | Bridge for strings emitted by `stream-chat` (the LLC) |
| `src/i18n/Streami18n.ts` | Layering, `registerTranslation`, `setLanguage`, dayjs config |
| `src/i18n/utils.ts` | `asDynamicKey`, `defaultTranslatorFunction` |
| `scripts/generate-i18n-keys.mts` | The catalog generator and its four hard-fail guards |
| `scripts/i18n-call-sites.mts` | The `t()` call-site parser |
| `src/i18n/__tests__/Streami18n.test.ts` | ~62 tests; port the behavioural ones |
| `ai-docs/i18n-v15-migration.md` | The integrator-facing guide you must produce an RN analogue of |
| `ai-docs/i18n-v15-key-map.json` | 603-row v14→v15 key mapping — **your cross-SDK key source** |

To obtain the web SDK's full key catalog with English copy, run in that repo:

```bash
yarn i18n:export
```

---

## 2. Why this is happening (the two problems being solved)

1. **Bundle cost.** The 12 non-English JSON files under `package/src/i18n/` total ~366 KB raw /
   ~68.9 KB gzipped. They are statically imported by `package/src/utils/i18n/Streami18n.ts` and
   re-exported from `package/src/index.ts`, so they are unconditionally bundled. Metro does not
   tree-shake, so **every RN app pays for all 12 locales even if it only ever renders English.**
   This is strictly worse than the web case, where at least a bundler *could* in principle drop them.
2. **Key maintenance.** Keys are the English copy itself. In `en.json`, **303 of 469 entries are
   `"X": "X"`** pure duplication. Any copy edit silently orphans 12 translations, and identical
   words in different contexts cannot be disambiguated.

---

## 3. Measured baseline (verify these before you start; the repo moves)

| Metric | Value |
| --- | --- |
| Locale JSONs | 13 (`en` + 12) in `package/src/i18n/` |
| Non-English weight | 366,412 bytes raw / 68,857 bytes gzip |
| `en.json` keys | 469 |
| Identity `"X": "X"` entries | 303 (65%) |
| Plural entries / distinct bases | 45 / 15 |
| `t('…')` call sites, non-test | 378 across 101 files |
| Distinct literal keys at call sites | 288 |
| `t('…')` **literals in tests** | 2 |
| English-text assertions in tests | 231 (`getByText` / `toHaveTextContent` / …) |
| i18next | `^25.2.1` |
| Test runner | `jest` (`TZ=UTC jest`) |
| `build-translations` | `i18next-cli sync` |
| `validate-translations` | `node bin/validate-translations.js` |

**The last two rows of the table are the key de-risking fact.** Tests assert on *rendered English
text*, not on keys. Because the English copy moves to an inline `defaultValue` at each call site,
rendered output is unchanged, and the existing suite becomes your proof that no copy regressed.
Treat a change in rendered English as a bug in your port, not as an expected consequence.

469 catalog keys vs 288 literal call-site keys means ~181 keys are either dead or reachable only at
runtime. Classify every one of them before deleting anything (see §8).

---

## 4. Key structure — specify exactly this

### Shape

A key is a **flat dotted string**. It is an identifier that happens to contain dots — it is *not* a
path into a nested object.

```
<namespace>.<component>.<element>[.<qualifier>].<modality>
```

- Lower camelCase for every segment.
- Depth 2–5. The web catalog distributes as depth 2: 101, depth 3: 174, depth 4: 352, depth 5: 6.
- `<namespace>` mirrors the source tree (`src/components/MessageInput/` → `messageInput.*`), so a
  key is predictable from the component that renders it.
- `<modality>` is the leaf and is drawn from a closed set:
  `.label`, `.ariaLabel`, `.placeholder`, `.title`, `.description`, `.text`, `.error`
- Genuinely shared copy — words reused across unrelated components — goes in `common.*`.

### Hard invariants (enforce these in the generator, not by convention)

1. **`keySeparator: false` and `nsSeparator: false` must stay set.** Keys are flat strings.
   Several copy values contain `...`, which `keySeparator: '.'` would mis-resolve. This is
   non-negotiable and was verified the hard way in the web port.
2. **No key may be a strict prefix of another key.** `poll.title` and `poll.title.text` must never
   coexist. The web catalog has zero such collisions across 633 keys; keep it that way. Add this
   as an explicit generator guard — it is what keeps a nested representation possible for anyone
   who wants one downstream.
3. **A key must never render as a raw dotted path in the UI.** See §6.

### Plurals

The catalog stores plural entries **suffixed**: `<key>_one`, `<key>_other`. Call sites use the
**bare** key and pass `count`. The suffixed forms are never referenced directly at a call site.

The SDK's own copy only needs `_one` / `_other`. The *type* must accept all six
`Intl.PluralRules` categories — `zero | one | two | few | many | other` — so that integrators
registering Arabic, Hebrew or Russian supply `_few` / `_many` / `_zero` **and stay type-checked**.
A plural suffix on a non-plural key must be a compile error.

> RN ships `ar` and `he` today, so this matters more here than it did on web. Do not narrow it.

### Namespaces whose values are not copy

Three namespaces hold formatter expressions or plumbing directives rather than English prose. They
resolve from bundled data and their call sites pass **no** inline default:

- `timestamp.*` — `{{ timestamp | timestampFormatter(...) }}`
- `duration.*` — `{{ milliseconds | durationFormatter(...) }}`
- `translationBuilderTopic.*` — an i18next postProcessor directive

Also bundled: `language.*` — ISO language *names* ("German", "Japanese"), because the key is built
from a runtime language code and the extractor can never see the call site.

⚠️ On web, four `timestamp.*` entries nonetheless embed **English day words** inside their
`calendarFormats` argument, so they must be overridden to be translated and
`dayjsLocaleConfigForLanguage` does not reach them. Find the RN equivalents (start at
`package/src/utils/i18n/calendarFormats.ts`), document them in the migration guide, and add the
same enumeration guard test so a fifth cannot be added silently.

---

## 5. Call-site form — specify exactly this

```ts
const { t } = useTranslationContext();

// prose: stable key, English copy inline as i18next's defaultValue
t('message.status.sent.text', 'Sent');

// plural: bare key, `count` required, one default per category
t('channel.memberCount.title', {
  count,
  defaultValue_one: '{{ count }} member',
  defaultValue_other: '{{ count }} members',
});

// formatter/plumbing key: resolves from runtimeDefaults, no inline default
t('timestamp.MessageTimestamp', { timestamp });

// runtime-resolved key: must be branded deliberately
t(asDynamicKey(command.description));
```

The inline default is the mechanism that makes a **partial** custom dictionary safe: an unsupplied
key still renders English. It also keeps the copy visible at the call site. Do not drop it.

---

## 6. Resolution order — the behavioural contract

Implement and test exactly this order:

1. `t(key, defaultValue)` looks `key` up in the **active language's** resource bundle.
2. That bundle is always **`runtimeDefaults` merged underneath the integrator's dictionary** — the
   integrator's value wins on conflict.
3. Key absent from the bundle → the inline `defaultValue` renders (English).
4. `fallbackLng: false` — never silently fall back to another language.
5. `parseMissingKeyHandler` handles a key with neither a bundle entry nor an inline default.

**Three guarantees that must hold, each with a regression test:**

- **G1.** *Every* language is layered over `runtimeDefaults` — however it was selected
  (`language` option, `registerTranslation`, `setLanguage`), including `en`, and **including when
  no dictionary is supplied at all**.
- **G2.** A partial dictionary is safe: unsupplied keys render English copy, never a raw dotted
  path, and never an ISO timestamp.
- **G3.** Selecting an unregistered language **warns and continues**. It must not silently reset
  the language to `en`.

These three were real bugs found in review of the web implementation. Write the tests first and
confirm they fail against the unported code.

---

## 7. Type surface to produce

Port `src/i18n/types.ts` near-verbatim. Names must match the web SDK exactly:

| Export | Meaning |
| --- | --- |
| `TranslationCatalog` | Generated, type-only: every key → its English copy |
| `TranslationKey` | The **call-site** key set: singulars + the bare handle for each plural |
| `PluralTranslationKey` | The base of each `_other` catalog entry |
| `TranslationDictionary` | **Strict** — what integrators annotate with; accepts all six plural categories |
| `LooseTranslationDictionary` | Escape hatch — also admits keys the SDK does not define |
| `DynamicTranslationKey` | Branded string; `asDynamicKey()` is the only way to make one |
| `StreamTFunction` | Four overloads: plural / formatter / prose / dynamic |

Two constraints learned the hard way on web — honour both:

- **Do not ship a global `declare module 'i18next'` / `CustomTypeOptions` augmentation.** It is
  global and would force every integrator's own unrelated `t()` calls to satisfy our key union.
  Define the typed signature locally and type the translation context's `t` as `StreamTFunction`.
- **Do not tie the prose overload's `defaultValue`/`options` to the key's exact copy.** That
  materialises a union of ~540 copy strings and exceeds TypeScript's union size limit (TS2590).
  Plural keys keep precise typing because that union is small. Read the comments in the web
  `types.ts` — they explain what is checked elsewhere instead.

Type-level cost is not a concern at this scale: the web catalog's 633 keys cost ~146k
instantiations and ~1.2s of `tsc`. Measure before and after anyway and report it.

---

## 8. Migration mechanics

The real work is naming ~470 keys. Make that **one reviewable artifact**, not 101 scattered diffs.

1. **Generate a draft mapping** `old English key → new dotted key`, deriving the namespace from the
   file path and the modality from the surrounding prop (`accessibilityLabel=` → `.ariaLabel`).
2. **Cross-reference `../stream-chat-react/ai-docs/i18n-v15-key-map.json` and the web catalog.**
   For any string that is conceptually the same as one the web SDK renders, **reuse the web SDK's
   key verbatim.** Report the hit rate. This is the single highest-value part of the task — an
   integrator shipping both SDKs should be able to share one dictionary for the overlap.
3. **Review the mapping by hand.** This is where naming judgment belongs.
4. **Classify all ~181 non-literal keys** before deleting: dead (delete), runtime-reachable via a
   dynamic key (keep, move to `runtimeDefaults`), or LLC-emitted (keep, add to `externalStrings`).
   A key is dead only if its string appears **nowhere** in non-test `src/` — not as a `t()`
   argument, not as an object property, not inside a conditional.
5. **Apply with a codemod** (`ts-morph`), handling the conditional `t(cond ? 'A' : 'B')` and
   object-property forms as well as plain calls.
6. **Keep the reviewed mapping as the published old→new migration table.** Without it, every
   integrator's existing `registerTranslation` overrides break silently.

### `externalStrings.ts`

`stream-chat` emits English `notification.message` strings that reach `t()` as runtime values, so
the extractor never sees them and they cannot be renamed from this repo. Port the web module: a
`Record<string, TranslationKey>` map plus a `translateExternalString` helper where unknown values
pass through unchanged. Generalise any ad-hoc RN lookup maps into it.

The generator must verify that each mapped English string still **matches its key's catalog copy**,
with an explicit allowlist for deliberate rephrasings.

---

## 9. Tooling to build

Replace `i18next-cli` and `bin/validate-translations.js` entirely.

- **`build-translations`** — parse the `t()` call sites, join with `runtimeDefaults`, regenerate the
  type-only catalog. Never hand-edit the generated file.
- **`i18n:export`** — write the joined catalog as JSON on demand, for a translator or TMS. There is
  **no checked-in `en.json`** after this change; a committed locale is a third copy of the same
  strings that needs an extract pass and a sync pass to stay honest.
- **`validate-translations`** — regenerate and `git diff --exit-code` the generated file. This is
  the CI drift gate.

**The generator must hard-fail on all five of:**

1. One key used with two different inline copies.
2. A key called with no inline default and no `runtimeDefaults` entry (it would render as the raw
   dotted key).
3. A key present in **both** the call sites and `runtimeDefaults` — the bundled value wins, so
   editing the call site would silently change nothing.
4. An `externalStrings` entry whose English text no longer matches its key's catalog copy.
5. **A key that is a strict prefix of another key** (§4, invariant 2).

`i18next-cli`'s `removeUnusedKeys` pass existed only to maintain `en.json`. Dead keys become
structurally impossible once a key exists *because* a call site declares it — which also retires
the `preservePatterns` footgun that nearly deleted the web SDK's 57 `language.*` keys.

---

## 10. Public API changes

- **Remove** `enTranslations` … `trTranslations` from `package/src/index.ts` and delete the 12
  non-English JSON files. Point integrators at the last published git tag to recover them.
- **`registerTranslation(language: string, translation: TranslationDictionary, customDayjsLocale?: DayjsLocaleConfig)`**
  — the third argument is how a single shared instance carries one dayjs config per language.
  Export `DayjsLocaleConfig` as `Partial<ILocale> & { calendar?: CalendarLocaleConfig }`. **`calendar`
  is not part of dayjs's `ILocale`**; typing this parameter as bare `Partial<ILocale>` produces a
  TS2345 "no properties in common" error the moment an integrator passes a calendar config. This
  was a real shipped bug on web — do not reproduce it.
- **`setLanguage(language: string)`** must swap the active language with no remount.
- Widen `language` / `defaultLanguage` / `userLanguage` from a closed union to `string`. Remove any
  `SupportedTranslations` union and `isLanguageSupported` guard.
- Only the `en` dayjs locale stays bundled. Integrators import their own `dayjs/locale/xx` and pass
  `dayjsLocaleConfigForLanguage`.

---

## 11. RN-specific items the web port did not face

1. **`accessibilityLabel`, not `aria-label`.** See Decision A below — do not choose unilaterally.
2. **RTL.** `ar` and `he` ship today and `I18nManager` / `isRTL` is used across many components.
   Removing the bundled locales must not disturb RTL layout behaviour, which is driven by
   `I18nManager`, not by the translation catalog. Verify explicitly and say so in the PR.
3. **`pt-br`** is a region-coded language code. Confirm your key/language handling does not choke
   on the hyphen, and that `language.*` entries cover region-coded codes (web has `es-MX`, `fa-AF`).
4. **Metro does not tree-shake** — state this in the PR as the bundle-size rationale.
5. **jest, not vitest.** Note that vitest does not typecheck; jest via babel does not either. Type
   errors surface only from `tsc`, so run it explicitly (see §12).
6. **i18next `^25.2.1`** vs web's 26.3.6. Check the features you rely on
   (`parseMissingKeyHandler`, `addResources`, `services.formatter.add()`, postProcessors) exist at
   25.x. Upgrade only if genuinely required, and say so.
7. **`copy-translations`** in the build script copies `src/i18n` into `lib/typescript/i18n`. Rework
   or delete it — after this change the catalog is a generated *type-only* module.

---

## 12. Verification

```bash
yarn test:unit                    # 231 English-text assertions must pass UNCHANGED
yarn typecheck                    # tsc --noEmit -p tsconfig.test.json
yarn validate-translations        # regenerate + git diff --exit-code
yarn lint
yarn build
```

Beyond green CI, produce evidence for each of these:

- **Bundle**: build on `develop` and on your branch, compare gzipped output. Expect **≈69 KB gzip**
  removed. Record actual before/after numbers in the PR — do not quote the estimate above as if it
  were a measurement.
- **G1/G2/G3** from §6, each with a test that you have *confirmed fails* against the unported code.
- **Degradation**: render with `Streami18n` uninitialised, and with a one-key dictionary registered
  for a new language; assert English copy renders — not dotted key paths.
- **Plurals**: `count: 1` vs `count: 5`; and a registered locale supplying `_few` / `_many`
  resolving correctly under `Intl.PluralRules`. When you write this test, **include the inline
  `defaultValue_one` / `defaultValue_other`** — omitting them makes partial plural dictionaries
  look broken when they are not.
- **External strings**: a raw LLC `notification.message` → mapped copy; an unrecognised one →
  verbatim passthrough.
- **RTL**: `ar` still lays out RTL.
- `tsc` wall time before vs after.
- Manually run `examples/SampleApp`: confirm the composer, message actions, poll and channel-detail
  screens render copy rather than key paths.

---

## 13. Decisions to escalate, not to make alone

Stop and ask before committing to any of these:

- **A. `.ariaLabel` vs `.accessibilityLabel` as the modality leaf.** The web SDK uses `.ariaLabel`.
  RN's prop is `accessibilityLabel`, so `.accessibilityLabel` is the idiomatic choice — but it
  breaks key sharing for *every* accessibility string across the two SDKs, which is a large share
  of the catalog. Recommendation: keep `.ariaLabel` for cross-SDK parity, on the grounds that the
  key is an identifier and not an RN API name. Confirm before proceeding — this is expensive to
  reverse.
- **B. How far to push cross-SDK key reuse** when the RN component tree diverges from web's.
  Report the overlap you found and propose a line.
- **C. Any i18next upgrade** (§11.6).
- **D. Copy changes.** Renaming keys is free in an unreleased major; *changing English wording* is
  not, and is out of scope. If a rename tempts you to reword, don't — flag it.

---

## 14. Out of scope

- Namespacing `stream-chat`'s notification strings at the source (separate LLC ticket).
- Re-adding any locale, in-repo or as a separate package.
- Changing English copy (see Decision D).

---

## 15. Working agreement

- Conventional commits; commitlint is enforced.
- **Do not use `BREAKING CHANGE` markers or `!`** — ship as a semver minor.
- Follow `PULL_REQUEST_TEMPLATE.md` (Goal / Implementation details / UI Changes).
- **Never force push.** If a commit needs updating, add a new commit.
- **Never commit without showing the diff summary and getting explicit approval first.**
- Land this in reviewable stages, not one 100-file commit. Suggested order: (1) tooling + types +
  `runtimeDefaults` with the old keys still in place, (2) the reviewed key mapping as a standalone
  artifact, (3) the codemod application, (4) locale deletion + public API changes, (5) docs.
