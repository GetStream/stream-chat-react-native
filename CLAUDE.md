# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Stream Chat React Native SDK monorepo. The main SDK code lives in `package/` (published as `stream-chat-react-native-core`). Built on top of the `stream-chat` JS client library.

## Common Commands

All commands below run from the repo root unless noted otherwise.

### Build

```bash
yarn build                    # Build all packages (runs in package/)
cd package && yarn build      # Build SDK directly
```

### Lint & Format

```bash
cd package && yarn lint       # Check prettier + eslint + translation validation (max-warnings 0)
cd package && yarn lint-fix   # Auto-fix lint and formatting issues
```

### Test

```bash
cd package && yarn test:unit              # Run all unit tests (sets TZ=UTC)
cd package && yarn test:coverage          # Run with coverage report
cd package && TZ=UTC npx jest path/to/test.test.tsx  # Run a single test file
```

Tests use Jest with `react-native` preset and `@testing-library/react-native`. Test files live alongside source at `src/**/__tests__/*.test.ts(x)`. Mock builders are in `src/mock-builders/`.

To run a single test, you can also temporarily add the file path to the `testRegex` array in `package/jest.config.js`.

### Install

```bash
yarn install --frozen-lockfile         # Root dependencies
cd package && yarn install-all         # SDK + native-package + expo-package
```

### Sample App

```bash
cd examples/SampleApp && yarn install
cd examples/SampleApp && yarn start    # Metro bundler
cd examples/SampleApp && yarn ios      # Run iOS
cd examples/SampleApp && yarn android  # Run Android
```

## Architecture

### Package Structure

- `package/` — Main SDK (`stream-chat-react-native-core`)
- `package/native-package/` — React Native native module wrappers
- `package/expo-package/` — Expo-compatible wrapper
- `examples/SampleApp/` — Full sample app with navigation
- `release/` — Semantic release scripts

### SDK Source (`package/src/`)

**Component hierarchy**: `<Chat>` → `<Channel>` → `<MessageList>` / `<MessageInput>` / `<Thread>`

- `components/` — UI components (~28 major ones: ChannelList, MessageList, MessageInput, Thread, Poll, ImageGallery, etc.)
- `contexts/` — React Context providers (~33 contexts). The primary way components receive state and callbacks. Key contexts: `ChatContext`, `ChannelContext`, `MessagesContext`, `ThemeContext`, `TranslationContext`
- `hooks/` — Custom hooks (~27+). Access contexts via `useChannelContext()`, `useMessageContext()`, etc.
- `state-store/` — Client-side state stores using `useSyncExternalStore` with selector pattern (audio player, image gallery, message overlay, etc.)
- `store/` — Offline SQLite persistence layer. `OfflineDB` class with mappers for channels, messages, reactions, members, drafts, reminders. Schema in `store/schema.ts`
- `theme/` — Deep theming system (colors, typography, spacing, per-component overrides) via `ThemeContext`
- `i18n/` — Internationalization with i18next (14 languages). `Streami18n` wrapper class
- `middlewares/` — Command UI middlewares (attachments, emoji)
- `icons/` — SVG icon components

### Key Patterns

**Component override pattern**: Nearly every UI element is replaceable via props. Parent components (e.g., `Channel`) accept 50+ `React.ComponentType` props for sub-components (`Message`, `MessageContent`, `DateHeader`, `TypingIndicator`, etc.). These props are forwarded into Context providers so deeply nested children can access them without prop drilling.

**Context three-layer pattern**: Each context follows the same structure:

1. `createContext()` with a sentinel default value (`DEFAULT_BASE_CONTEXT_VALUE`)
2. A `<XProvider>` wrapper component
3. A `useXContext()` hook that throws if used outside the provider (suppressed in test env via `isTestEnvironment()`)

Context values are assembled in dedicated `useCreateXContext()` hooks (e.g., `useCreateChannelContext`) that carefully memoize with selective dependencies to avoid unnecessary re-renders.

**Native module abstraction**: `native.ts` defines TypeScript interfaces for all platform-specific capabilities (image picking, compression, haptics, audio/video, clipboard). Implementations are injected at runtime via `registerNativeHandlers()` — `stream-chat-expo` provides Expo implementations, `stream-chat-react-native` provides bare RN ones. Calling an unregistered handler throws with a message to import the right package.

**State stores**: `useSyncExternalStore`-based stores in `state-store/` with `useStateStore(store, selector)` for fine-grained subscriptions outside the context system.

**Memoization**: Components use `React.memo()` with custom `areEqual` comparators (not HOCs) to prevent re-renders.

**Offline-first**: SQLite-backed persistence with sync status tracking and pending task management.

**Builder-bob builds**: Outputs CommonJS (`lib/commonjs`), ESM (`lib/module`), and TypeScript declarations (`lib/typescript`).

### Testing Patterns

Tests use `renderHook()` and `render()` from `@testing-library/react-native`. Components/hooks must be wrapped in the required provider stack (e.g., `Chat` → `Channel` → feature provider).

**Mock builders** (`src/mock-builders/`):

- `api/initiateClientWithChannels.js` — creates a test client + channels in one call
- `generator/` — factories: `generateMessage()`, `generateChannel()`, `generateUser()`, `generateMember()`, `generateStaticMessage(seed)` (deterministic via UUID v5)
- `attachments.js` — `generateImageAttachment()`, `generateFileAttachment()`, `generateAudioAttachment()`

Reanimated and native modules are mocked via Proxy patterns in test setup files.

### Theme System

Themes follow a three-tier token architecture: **Primitives** (raw colors) → **Semantics** (e.g., `colors.error.primary`) → **Components** (per-component overrides). Token references use `$key` string syntax (e.g., `"$blue500"`) and are resolved via topological sort in `theme/topologicalResolution.ts`, so declaration order doesn't matter.

Platform-specific tokens are **generated** files in `src/theme/generated/{light,dark}/StreamTokens.{ios,android,web}.ts` — regenerate via `sync-theme.sh` if design tokens change; don't hand-edit.

Custom themes are passed as `style` prop to `<Chat>`. `mergeThemes()` deep-merges custom style over base theme (deep-cloned via `JSON.parse(JSON.stringify())`). Light/dark mode is auto-detected via `useColorScheme()`.

### Native / Expo Package Relationship

`native-package/` and `expo-package/` are thin wrappers around `stream-chat-react-native-core`. They:

1. Call `registerNativeHandlers()` with platform-specific implementations (native modules vs Expo APIs)
2. Export optional dependency wrappers (`Audio`, `Video`, `FlatList`) from `src/optionalDependencies/`
3. Re-export everything from core: `export * from 'stream-chat-react-native-core'`

Platform branching uses runtime `Platform.select()` / `Platform.OS` checks — there are no `.ios.ts` / `.android.ts` source file splits.

### Chat Component (Root Provider)

`<Chat client={client}>` is the entry point. It:

- Sets SDK metadata on the `stream-chat` client (identifier, device info)
- Disables the JS client's `recoverStateOnReconnect` (the SDK handles recovery itself)
- Registers subscriptions for threads, polls, and reminders (cleaned up on unmount)
- Initializes `OfflineDB` if `enableOfflineSupport` is true
- Wraps children in: `ChatProvider` → `TranslationProvider` → `ThemeProvider` → `ChannelsStateProvider`

### Offline DB

SQLite schema is in `store/schema.ts`. DB versioning uses `PRAGMA user_version` — a version mismatch triggers full DB reinit (no incremental migrations). Current version is tracked in `SqliteClient.dbVersion`.

### Translations

Translation JSON files live in `src/i18n/`. `validate-translations` (run as part of `yarn lint`) checks that no translation key has an empty string value. When adding/updating translations, run `yarn build-translations` (i18next-cli sync) to keep files in sync.

## Conventions

- **Conventional commits** enforced by commitlint: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- **ESLint 9 flat config** at `package/eslint.config.mjs`, strict (max-warnings 0)
- **Prettier**: single quotes, trailing commas, 100 char width (see `.prettierrc`)
- **TypeScript strict mode** with platform-specific module suffixes (`.ios`, `.android`, `.web`)
- Git branches: PRs target `develop`, `main` is production releases only
- **Shared native sync**: Run `yarn shared-native:sync` from `package/` after modifying shared native code to copy to native-package and expo-package
