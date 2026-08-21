# AGENTS.md

Guidance for AI coding agents (Claude Code, Copilot, Cursor, Codex, Aider, etc.) working in this repository. Human readers are welcome, but this file is written for tools.

> **Single source of truth.** `CLAUDE.md` contains nothing but `@AGENTS.md`, which Claude Code expands into this file. Edit this file only — never fork guidance into `CLAUDE.md`.

Agents should prioritize backwards compatibility, API stability, accessibility, performance discipline and high test coverage when changing code.

## Repository purpose

Stream Chat React Native SDK monorepo. The core UI SDK lives in `package/` (published as `stream-chat-react-native-core`) and is built on top of the `stream-chat` JS client. Two thin wrappers ship it to the two supported toolchains:

- `stream-chat-react-native` (`package/native-package/`) — React Native CLI / bare RN
- `stream-chat-expo` (`package/expo-package/`) — Expo

Targets iOS and Android.

## Tech & toolchain

- **Languages:** TypeScript + React Native
- **Runtime:** Node 24 (`.nvmrc` is `v24`; root `engines.node` is `>=20.19.4`; CI runs `24.x`)
- **Package manager:** Yarn 4.15.0 (Berry). The binary lives at `.yarn/releases/yarn-4.15.0.cjs` and is activated via `yarnPath` in `.yarnrc.yml`. Any globally installed `yarn` (even the Homebrew classic 1.x) acts only as a launcher — no Corepack required.
- **Workspaces:** single root `yarn.lock`; workspaces are `configs/typescript-config`, `package`, `package/native-package`, `package/expo-package`, `examples/SampleApp`, `examples/ExpoMessaging`. **No Lerna.**
- **Testing:** Jest with the `@react-native/jest-preset` + `@testing-library/react-native`.
- **Build:** `react-native-builder-bob` → CommonJS (`lib/commonjs`), ESM (`lib/module`), types (`lib/typescript`)
- **Lint/format:** ESLint 9 flat config + Prettier, strict (`--max-warnings 0`)
- **CI:** GitHub Actions — PR validation on build + lint + typecheck + tests
- **Release:** Conventional Commits + semantic-release, driven by `yarn workspaces foreach`

### Root configuration files

`.nvmrc` · `.yarnrc.yml` · `eslint.config.mjs` · `.prettierrc` / `.prettierignore` · `commitlint.config.js` · `configs/typescript-config/` (`base.json`, `library.json` — the shared presets `package/tsconfig.json` extends) · `.editorconfig` · `.husky/`

Per-package: `package/tsconfig.json` (library) · `package/tsconfig.test.json` (tests) · `package/jest.config.js` · `package/babel.config.js`

Respect repo-specific rules. Do not suppress lint rules broadly; justify and scope every exception with an inline comment.

## Project layout

- `package/` — core SDK (`stream-chat-react-native-core`)
  - `native-package/` — bare RN wrapper (`stream-chat-react-native`)
  - `expo-package/` — Expo wrapper (`stream-chat-expo`)
  - `shared-native/{ios,android}` — native source shared by both wrappers; synced into them, never edited in place
- `examples/` — `SampleApp` (full-featured), `ExpoMessaging`
- `configs/typescript-config/` — shared `tsconfig` presets
- `ai-docs/` — agent-facing deep dives (see [References](#references))
- `perf/` — on-device performance toolkit (see [Accessibility, RTL & performance](#accessibility-rtl--performance))
- `release/` — semantic-release scripts
- `bin/`, `dotgit/hooks/` — release and git-hook scripts

### SDK source (`package/src/`)

- `components/` — 27 component directories (`ChannelList`, `MessageList`, `MessageInput`, `Thread`, `Poll`, `ImageGallery`, `ChannelDetails`, `MessageMenu`, …)
- `contexts/` — 40 React Context providers. The primary way components receive state and callbacks. Key ones: `chatContext`, `channelContext`, `messagesContext`, `themeContext`, `translationContext`
- `hooks/` — shared custom hooks; component-specific hooks live in that component's `hooks/`
- `state-store/` — client-side stores on `useSyncExternalStore` with a selector pattern (audio player, video player, image gallery, message overlay, attachment picker, …)
- `store/` — offline SQLite persistence: `OfflineDB.ts`, `SqliteClient.ts`, `schema.ts`, `mappers/`, `apis/`
- `theme/` — theming system + `topologicalResolution.ts` + `generated/` tokens
- `i18n/` — the translation key layer: generated `keys.ts` catalog, `types.ts`, `runtimeDefaults.ts`, `utils.ts`. No locale JSON — the SDK ships English only. The runtime lives in `stream-chat/i18n`, shared with the React SDK; `utils/i18n/Streami18n.ts` is a thin subclass injecting this package's bundled data
- `a11y/` — accessibility primitives (`a11yUtils.ts`, `hooks/`)
- `middlewares/` — command UI middlewares (`attachments.ts`, `emojiControl.ts`)
- `icons/` — SVG icon components
- `mock-builders/` — test fixtures and fakes (also aliased as `mock-builders` in Jest)
- `native.ts` — native-capability interfaces + `registerNativeHandlers()`

Use the closest folder's patterns and conventions when editing.

## Environment setup

```bash
nvm use          # Node 24
yarn install     # every workspace, single root lockfile
yarn test:unit   # smoke-check the setup
```

## Essential commands

All commands run from the repo root unless noted.

```bash
# Install
yarn install                  # every workspace (single root lockfile)
yarn install --immutable      # CI-style; fails if yarn.lock would change

# Build
yarn build                    # SDK build (commonjs + esm + types) via builder-bob

# Test
yarn test:unit                # all unit tests (sets TZ=UTC)
yarn test:coverage            # with coverage — what CI runs
cd package && TZ=UTC npx jest path/to/file.test.tsx   # single file

# Type checking
yarn typecheck                # every workspace + example app, in parallel
cd package && yarn test:typecheck                     # SDK src + tests + mock-builders

# Lint / format
yarn lint                     # prettier --list-different + eslint --max-warnings 0 + validate-translations
yarn lint-fix                 # ALWAYS run this before committing
yarn eslint <path>            # eslint a single path

# Translations
yarn workspace stream-chat-react-native-core build-translations   # regenerate src/i18n/keys.ts
yarn workspace stream-chat-react-native-core i18n:export          # dump en.json for a translator

# Shared native sync (after editing package/shared-native/)
yarn workspace stream-chat-react-native-core shared-native:sync

# Sample app
yarn workspace sampleapp start    # Metro bundler
yarn workspace sampleapp ios
yarn workspace sampleapp android
```

**Type gates — know which one is strict.** `yarn typecheck` fans out to every workspace; each SDK workspace runs `tsc --noEmit -p tsconfig.test.json`, which includes tests and `mock-builders` but relaxes `noUnusedLocals` / `noUnusedParameters`. `package`'s `typecheck` and `test:typecheck` are currently the same command. The **strictest** gate is `yarn build`: bob type-checks with `package/tsconfig.json`, which keeps the unused-symbol rules on and excludes `__tests__` / `mock-builders`. Always run `cd package && yarn test:typecheck` after code changes — `yarn lint` and `yarn test:unit` do not catch all type errors.

**Adding dependencies.** `.yarnrc.yml` sets `npmMinimalAgeGate: 3d`, so packages published within the last three days are refused unless listed under `npmPreapprovedPackages` (currently `stream-chat`, `react-native-teleport`). `enableScripts: false` disables install scripts globally; per-package opt-ins live in root `dependenciesMeta` (`@swc/core`, `better-sqlite3`, `react-native-nitro-modules`, `unrs-resolver`). `nmHoistingLimits: workspaces` keeps workspace deps unhoisted — expect duplicated copies under each workspace's `node_modules`.

## Architecture: core concepts

### Component hierarchy

```
<OverlayProvider>            # gesture/overlay host, accessibility config
  └─ <Chat client={client}>  # root: SDK metadata, offline DB, subscriptions
      ├─ <ChannelList>
      └─ <Channel>           # state container: messages, threads, composer
          ├─ <MessageList>
          ├─ <MessageInput>
          └─ <Thread>
```

`<Chat>` is the entry point. It sets SDK metadata on the `stream-chat` client (identifier, device info), disables the JS client's `recoverStateOnReconnect` (the SDK handles recovery itself), registers subscriptions for threads/polls/reminders (cleaned up on unmount), initializes `OfflineDB` when `enableOfflineSupport` is set, and wraps children in `ChatProvider` → `TranslationProvider` → `ThemeProvider` → `ChannelsStateProvider`.

### Context three-layer pattern

Every context in `package/src/contexts/` follows the same shape:

1. `createContext()` with a sentinel default (`DEFAULT_BASE_CONTEXT_VALUE`)
2. an `<XProvider>` wrapper component
3. a `useXContext()` hook that throws when used outside the provider (suppressed in tests via `isTestEnvironment()`)

Context values are assembled in dedicated `useCreateXContext()` hooks (e.g. `useCreateChannelContext`) that memoize with **selective** dependencies to avoid unnecessary re-renders.

### Customization: `WithComponents`, not component props

`ChannelProps` **does not** accept component overrides (that was the v8 API — see `ai-docs/ai-migration.md` §3.1). Slots come from `ComponentsContext`, populated by `<WithComponents overrides={{ … }}>`, which merges over the parent context so nesting works (closest wins) and deep-merges the nested `icons` map:

```tsx
<WithComponents overrides={{ Message: MyMessage, SendButton: MySendButton, icons: { Mute: MyMute } }}>
  <Channel channel={channel}>
    <MessageList />
    <MessageInput />
  </Channel>
</WithComponents>
```

`package/src/contexts/componentsContext/defaultComponents.ts` is the authority: it exports `DEFAULT_COMPONENTS` with ~173 slots plus a nested `icons` map of ~92 icons, and `ComponentOverrides` is *derived* from it — **adding a default automatically makes it overridable.** Read slots with `useComponentsContext()`, which merges user overrides over the defaults so every slot is guaranteed defined and callers destructure without fallbacks.

Two mechanics not to "fix":

- Both `WithComponents` and `useComponentsContext` memoize with `[]` — overrides are read once at mount and **must be stable**. Do not inline an override object that changes identity per render.
- `defaultComponents` is `require`d lazily inside `getDefaults()` to break a circular import (`defaultComponents` → components → `useComponentsContext`). Do not convert it to a static top-level import.

`Channel`'s own props are behavioral escape hatches instead, typed as `Pick<…ContextValue, …>` over the contexts it provides (handlers like `handleDelete` / `handleReaction`, `messageActions`, `supportedReactions`, `myMessageTheme`, `overrideOwnCapabilities`, …).

When adding a customizable component: add it to `DEFAULT_COMPONENTS`, then read it via `useComponentsContext()`.

### State stores

`state-store/` holds `useSyncExternalStore`-based stores consumed with `useStateStore(store, selector)` for fine-grained subscriptions outside the context system. Define selectors at module scope so they stay referentially stable — an inline selector re-subscribes on every render.

### Native module abstraction

`package/src/native.ts` declares TypeScript interfaces for every platform-specific capability (image picking, compression, haptics, audio/video, clipboard, share). Implementations are injected at runtime via `registerNativeHandlers()`: `stream-chat-expo` supplies Expo implementations, `stream-chat-react-native` supplies bare-RN ones. Calling an unregistered handler throws with a message naming the package to import.

Platform branching uses runtime `Platform.select()` / `Platform.OS` checks. There is **no** `moduleSuffixes` in any tsconfig, and the only platform-suffixed source files are the generated theme tokens (`theme/generated/*/StreamTokens.{ios,android,web}.ts`), resolved by Metro's platform extensions. Do not introduce new `.ios.ts` / `.android.ts` splits.

### Native / Expo wrapper relationship

Both wrappers are thin. They:

1. call `registerNativeHandlers()` with platform-specific implementations
2. export optional dependency wrappers (`Audio`, `Video`, `FlatList`) from `src/optionalDependencies/`
3. re-export everything: `export * from 'stream-chat-react-native-core'`

Native code shared by both wrappers lives in `package/shared-native/{ios,android}` and is copied into each wrapper by `shared-native:sync`. **Edit `shared-native/`, never the synced copies.**

## Critical architectural patterns

- **Memoization:** components use `React.memo()` with custom `areEqual` comparators (not HOCs). Comparators check cheap props before deep message comparison — keep that ordering when extending one.
- **Offline-first:** SQLite-backed persistence with sync-status tracking and a pending-task queue. Writes must go through `OfflineDB`, not raw SQL.
- **Selective memo dependencies:** `useCreateXContext` hooks intentionally omit unstable values. Adding a dependency there can cause a re-render storm; removing one can cause stale UI. Profile before changing.
- **Cancel stale async work:** media and network operations must be cancelled on unmount (`AbortController` for fetch-like APIs, unsubscribe listeners). Check instance IDs / timestamps before applying async results to state to avoid races.

## Critical gotchas & invariants

### DO NOT

1. **Edit generated or synced files** (see below) — regenerate them instead.
2. **Add `channel` or `channel.state` to dependency arrays** — use `channel.cid`, which is stable.
3. **Mutate `channel.state.messages` directly** — go through the `stream-chat` client's state API.
4. **Inline a `useStateStore` selector** — define it at module scope.
5. **Use unguarded web-only APIs in shared code** — it runs on Hermes, not a browser.
6. **Bypass lint or type errors** with broad disables or force merges.

### Generated / synced files — never hand-edit

- `package/lib/` and all build artifacts
- `package/src/theme/generated/{light,dark}/StreamTokens.{ios,android,web}.ts` → regenerate with `package/sync-theme.sh`
- `package/{native,expo}-package/{ios,android}/**/shared/` → regenerate with `shared-native:sync`
- `examples/ExpoMessaging/{ios,android}` (prebuild output); `ios/build` and `android/build` in the other sample apps
- `node_modules/` everywhere

### React Native specifics

- Clear Metro cache on module-resolution weirdness: `yarn react-native start --reset-cache` (RN CLI) or `yarn expo start --dev-client -c` (Expo)
- Test on **both** iOS and Android for native-module or platform-specific UI changes
- If an example app fails to build or install:
  - `watchman watch-del-all && rm -rf ~/Library/Developer/Xcode/DerivedData/*`
  - `(cd ios && bundle exec pod install)` (RN CLI sample apps)
  - `npx expo prebuild` (after changing `ExpoMessaging`'s `app.json`)
  - `rm -rf ios && rm -rf android` (after installing new native modules in `ExpoMessaging`)

## Testing

**Policy:** add or extend tests in the matching module's `__tests__/` folder. Cover new public API, bug fixes (as regression tests), and performance-sensitive utilities. Reuse the repo's fakes and mock builders instead of hand-rolling new ones. Do not let global coverage drop.

**Runner:** Jest (`package/jest.config.js`) with the `@react-native/jest-preset`, `testEnvironment: 'node'`, `TZ=UTC` forced by `yarn test:unit`, `maxWorkers: 2` on CI. `mock-builders(.*)` is aliased to `src/mock-builders`. Test files live alongside source at `src/**/__tests__/*.test.ts(x)`.

`package/jest-setup.tsx` calls `registerNativeHandlers()` with test doubles and `jest.mock()`s every peer native module (reanimated, worklets, gesture-handler, netinfo, `@gorhom/bottom-sheet`, `@op-engineering/op-sqlite`, `@shopify/flash-list`, safe-area-context, `react-native-teleport`, `RefreshControl`). Add new peer native modules there or tests will fail to resolve them.

To run one test file, prefer `cd package && TZ=UTC npx jest path/to/file.test.tsx`. The `testRegex` array in `jest.config.js` also accepts a temporary path — revert it before committing.

**Mock builders** (`package/src/mock-builders/`):

- `api/initiateClientWithChannels` — creates a test client + channels in one call (fastest path)
- `api/` — response builders (`getOrCreateChannel`, `queryChannels`, `queryMembers`, `sendMessage`, `sendReaction`, `threadReplies`, `error`) plus `useMockedApis`
- `generator/` — `generateMessage()`, `generateChannel()`, `generateUser()`, `generateMember()`, `generateReaction()`, `generateStaticMessage(seed)` (deterministic via UUID v5)
- `attachments.ts` — `generateImageAttachment()`, `generateFileAttachment()`, `generateAudioAttachment()`
- `event/`, `DB/` — event dispatchers and offline-DB fakes

Tests use `render()` / `renderHook()` from `@testing-library/react-native`. Components and hooks must be wrapped in the required provider stack (e.g. `Chat` → `Channel` → feature provider). Mock methods on the channel/client — never replace the whole object.

## Build system

`yarn build` runs `package`'s build: `rimraf lib` → `build-translations` (regenerates `src/i18n/keys.ts`) → `bob build`.

`react-native-builder-bob` emits three targets from `src`:

| Target       | Output           | Entry point in `package.json` |
| ------------ | ---------------- | ----------------------------- |
| `commonjs`   | `lib/commonjs`   | `main`                        |
| `module`     | `lib/module`     | `module`                      |
| `typescript` | `lib/typescript` | `types`                       |

`shared-native:sync` is **not** wired into install or build — run it manually after editing `package/shared-native/`.

## Theming

Three-tier token architecture: **primitives** (raw colors) → **semantics** (e.g. `colors.error.primary`) → **components** (per-component overrides). Token references use a `$key` string syntax (e.g. `"$blue500"`) resolved by a topological sort in `package/src/theme/topologicalResolution.ts`, so declaration order does not matter.

Platform-specific tokens are **generated**: `package/src/theme/generated/{light,dark}/StreamTokens.{ios,android,web}.ts`. Regenerate via `package/sync-theme.sh` when design tokens change — never hand-edit them.

Custom themes are passed as the `style` prop to `<Chat>`. `mergeThemes()` deep-merges the custom style over the base theme (deep-cloned via `JSON.parse(JSON.stringify())`). Light/dark mode is auto-detected via `useColorScheme()`.

## i18n

**English only.** From v10 the SDK ships no locale files. Every UI string is a stable dotted key
(`message.status.sent.text`) whose English copy is passed inline at the call site as i18next's
`defaultValue`, so an untranslated key renders readable English rather than a raw dotted path.
Integrators add languages additively — there is nothing in the SDK to fork or keep in sync.

- `package/src/i18n/keys.ts` is **generated and type-only** — never hand-edit. It maps every key to
  its English copy, and the i18n types derive `TranslationKey` / `StreamTFunction` from it, so a
  typo'd or stale key is a compile error rather than a string that silently stops rendering.
- The catalog has exactly two sources: inline defaults at the call sites, and
  `package/src/i18n/runtimeDefaults.ts` — the only translation data that ships. `runtimeDefaults`
  holds just the keys with no inline copy to fall back on: `timestamp.*` / `duration.*` formatter
  expressions passed around as prop values, and keys built from a runtime value.
- **The runtime is `stream-chat/i18n`**, shared with the React SDK — one `Streami18n`, one set of
  formatters, one date layer. `package/src/utils/i18n/Streami18n.ts` is a ~30-line subclass that
  injects this package's `runtimeDefaults` (core cannot import them: the catalog is generated from
  *this* package's call sites). A behavioural fix belongs in `stream-chat`, not here. Access `t` via
  `useTranslationContext()`. `registerTranslation` **merges**, so a partial dictionary can never
  knock out the bundled formatter keys.
- **Reactivity is a `StateStore`,** not listeners. `i18n.state` publishes
  `{ t, tDateTimeParser, language, initialized }`; `useStreami18n` subscribes with a module-scope
  selector. `setLanguage()` returns `void` — the new `t` arrives through the store. There is no
  `addOnLanguageChangeListener`, and `getTranslators()` is now `init()`. **Nothing is kept as a
  deprecated alias** — v10 is a breaking release, so an old name is removed rather than carried with a
  countdown on it. `relativeCompactDateFormatter` is gone the same way: use `timestampFormatter` with
  `relativeCompact: true`, whose wording goes through `t()`.
- `language.*` (ISO language names) and `relativeTime.*` are typed into the catalog but come from
  core, which owns the code that renders them. Neither is declared in `runtimeDefaults`.
- Notification copy is keyed on `stream-chat`'s `CORE_NOTIFICATION_TYPE`, in
  `components/Notifications/notificationTranslations.ts`, as a `Record<CoreNotificationType, …>` — so
  a new core identifier is a compile error until it is mapped. Never match on `notification.message`;
  that is untranslated English whose wording is not part of core's contract. Poll field errors are
  keyed the same way, on `POLL_COMPOSER_VALIDATION_CODE`.
- **`dayjs` must resolve to exactly one copy.** Its range here has to stay compatible with core's
  (`^1.11.13`) — an exact pin installs a second copy, `instanceof Dayjs` starts failing, and an
  integrator's `import 'dayjs/locale/de'` lands on an instance the SDK never formats with. Do not
  declare `i18next` at all; it arrives through `stream-chat`.
- Only the `en` dayjs locale is bundled, and **no dayjs locale defines `calendar`** (that field
  belongs to the calendar plugin) — a new language needs both `import 'dayjs/locale/xx'` and a
  `calendar` config, or relative dates render English scaffolding around translated day names.
- Generation: `build-translations` runs `package/scripts/generate-i18n-keys.mts`, now a ~40-line
  config shim over the generator in `stream-chat/i18n/codegen` (also shared with the React SDK). Four
  hard-fail guards: conflicting inline copy, unresolvable key, shadowed key, strict prefix. The
  external-string drift guard is gone with `externalStrings.ts`. The fixture tests live in
  `stream-chat`'s own suite — there is no longer a `node --test` step here.
- Validation: `validate-translations` runs inside `yarn lint` and in CI. It is a **drift gate** —
  it regenerates `keys.ts` and fails if the result differs from what is committed.
- Adding a string: call `t('some.dotted.key', 'English copy')` → run `build-translations` → commit
  the regenerated `keys.ts`. Do not add locale files.
- `i18n:export` writes a translator-facing `en.json`. It deliberately omits formatter expressions
  and names the few that still carry English, which must be translated by overriding the key.
- Worked example of adding a language: `examples/SampleApp/src/i18n/` (German + Italian + README).

## Offline DB

The SQLite schema lives in `package/src/store/schema.ts`. Versioning uses `PRAGMA user_version`; a mismatch triggers a **full DB reinit** (there are no incremental migrations). The current version is `SqliteClient.dbVersion` (`package/src/store/SqliteClient.ts`) — bump it whenever the schema changes, or existing installs will read a stale schema.

`OfflineDB` owns channels, messages, reactions, members, drafts and reminders through `mappers/`. Offline support is opt-in via `<Chat enableOfflineSupport>`.

## Accessibility, RTL & performance

This repo ships three project skills — load the relevant one **before** touching these areas rather than improvising:

- `.claude/skills/accessibility` — VoiceOver/TalkBack work: interactive components, gestures, modals, lists, media controls, focus behavior, live announcements
- `.claude/skills/rtl` — anything with a horizontal or directional axis: styles, positioning, flex, swipe gestures, animated transforms, icons, text alignment
- `.claude/skills/perf-benchmarking` — on-device measurement: Hermes CPU profiles, render profiling, deterministic call counting, memory/jank capture. Drives `examples/SampleApp` on a connected Android device via the `perf/` toolkit (`scenario-lib.sh`, `capture-hermes-profile.js`, `analyze-react-profile.js`, `analyze-cpuprofile.js`, `android-heap-dump.sh`; see `perf/README.md`).

Accessibility is **opt-in** — see `ai-docs/accessibility.md` for the full contract. New interactive UI should reuse the primitives in `package/src/a11y/`.

**Performance guidelines:** minimize re-renders (memoization, stable refs); reach for `React.memo` / `useCallback` / `useMemo` when profiling justifies it, not reflexively; clean up side effects; prefer lazy loading for optional heavy modules; monitor bundle size and justify increases over 2% per package (tracked by the `sdk-size-metrics` workflow).

## API design principles

- Semantic versioning; avoid breaking changes, prefer additive evolution
- Public surfaces get explicit TypeScript types/interfaces
- Consistent naming: `camelCase` for functions and properties, `PascalCase` for components and types
- Mark removals with `@deprecated` JSDoc plus replacement guidance
- Provide migration docs for breaking changes

### Deprecation lifecycle

1. Mark with `@deprecated` + rationale + alternative
2. Maintain for at least one minor release unless security-critical
3. Add to migration documentation
4. Remove only in the next major

## Error & logging policy

- Public API: throw descriptive errors or return typed error results, consistent with existing patterns
- No console noise in production builds; gate internal debug logging behind an env flag
- Never leak credentials or user data in errors

## Contribution rules

### Linting & formatting

Run `yarn lint-fix` before every commit. Follow the zero-warnings policy — fix new warnings, never introduce any. Scope `eslint-disable` narrowly with an inline rationale; no broad rule disabling.

Prettier: single quotes, trailing commas, 100-char width (120 for Markdown) — see `.prettierrc`.

### Git hooks

- `.husky/commit-msg` → `commitlint --edit` (Conventional Commits enforced)
- `.husky/pre-commit` → `dotgit/hooks/pre-commit-format.sh && dotgit/hooks/pre-commit-reject-binaries.py`
- Root `postinstall` runs `husky`

### Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, …

```
feat(MessageInput): add audio recording support

Implement MediaRecorder integration with MP3 encoding.

Closes #123
```

- Never commit directly to `develop` or `main` — always create a feature branch
- PRs target `develop`; `main` is production releases only
- Never commit unless explicitly requested

### Pull requests

Follow `PULL_REQUEST_TEMPLATE.md`. Keep PRs small and focused.

- [ ] `yarn lint-fix` passed
- [ ] `yarn test:unit` passed
- [ ] `cd package && yarn test:typecheck` passed
- [ ] `yarn build` succeeds
- [ ] Tests added for changes
- [ ] No new warnings (zero tolerance)
- [ ] Screenshot or video (before/after) for UI changes
- [ ] Public API changes documented
- [ ] Breaking changes labeled clearly in the description

### CI expectations

`.github/workflows/check-pr.yml` (Node 24): `yarn install --immutable` → `yarn build` → `yarn lint` → `yarn typecheck` → `yarn test:coverage`. Other workflows: `changelog-preview`, `lint-pr-title`, `release`, `sample-distribution`, `sdk-size-metrics`.

Failing or flaky tests: fix them, or quarantine with a justification comment and a follow-up.

### Release

Conventional Commits feed semantic-release; the pipeline uses `yarn workspaces foreach` directly (no Lerna). Release-participating workspaces (core SDK + SampleApp) are hardcoded in `release/release.config.js`. Version bump → changelog → tag → publish; deprecations are noted in `CHANGELOG`. Ensure docs are updated before publishing breaking changes. See `RELEASE_PROCESS.md`.

### Dependency policy

Avoid large dependencies without justification (size, maintenance). Prefer existing utilities. Keep upgrades separate from feature changes. Respect the `npmMinimalAgeGate` rule above.

### Samples & docs

New public feature: update at least one sample app. Breaking change: provide a migration snippet. Keep code snippets compilable. Use placeholder keys (`YOUR_STREAM_KEY`).

### Security

Never commit API keys or real user data. Example code must use obvious placeholders. Scripts must fail closed on missing env vars. Avoid introducing unmaintained dependencies. See `SECURITY.md`.

## Quick agent checklist (per change)

- `yarn build` succeeds
- `yarn lint` clean, no new warnings
- `cd package && yarn test:typecheck` clean
- `yarn test:unit` green, coverage not reduced
- No generated or synced files modified by hand
- Public API docs updated if the API changed
- Samples updated if a feature surfaced
- Both platforms checked for native or platform-specific UI changes

## References

- **Agent deep dives:** `ai-docs/ai-migration.md` (v8 → v9) and `ai-docs/ai-migration-v9-to-v10.md` (v9 → v10) — load these instead of the prose upgrade guides for agent-driven migrations; `ai-docs/accessibility.md` (opt-in a11y layer); `ai-docs/i18n-v10-migration.md` + `ai-docs/i18n-v10-key-map.json` (English-only i18n, and the reviewed old-key → dotted-key map)
- **Repo skills:** `.claude/skills/{accessibility,rtl,perf-benchmarking}`, `perf/README.md`
- **Contributing / process:** `CONTRIBUTING.md`, `RELEASE_PROCESS.md`, `PULL_REQUEST_TEMPLATE.md`, `SECURITY.md`
- **Component docs:** https://getstream.io/chat/docs/sdk/reactnative/
- **Stream Chat API:** https://getstream.io/chat/docs/javascript/
- **Stream agent skills** (installed via `getstream init`): https://getstream.io/agent-skills/docs/installation/

---

End of machine guidance. Edit this file to refine agent behavior over time; keep human-facing explanations in `README.md` and the docs site.
