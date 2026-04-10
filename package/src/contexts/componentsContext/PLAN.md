# WithComponents — Component Override System

## Design Principle

**All components are read from `useComponentsContext()`. All other contexts only provide data + APIs — never components.**

## Current State (Completed)

### What was done

1. **Created `ComponentsContext`** — `WithComponents` provider, `useComponentsContext()` hook, `ComponentOverrides` type
2. **Created `defaultComponents.ts`** — centralized map of all ~130 default components
3. **Stripped component keys** from all existing context types: `MessagesContextValue`, `InputMessageInputContextValue`, `ChannelContextValue`, `ChannelsContextValue`, `AttachmentPickerContextValue`, `ThreadsContextValue`, `ImageGalleryContextValue`
4. **Simplified `useCreate*Context` hooks** — no longer receive or forward component params
5. **Simplified `Channel.tsx`** — removed ~90 component imports, prop defaults, forwarding lines
6. **Simplified `ChannelList.tsx`** — removed ~19 component props
7. **Updated ~80 consumer files** — switched from old context hooks to `useComponentsContext()`
8. **Removed component override props** from ALL individual components
9. **Updated all 3 example apps** (SampleApp, ExpoMessaging, TypeScriptMessaging)
10. **Updated ~45 documentation pages** across docs-content repo
11. **Merged with develop** and resolved conflicts

### Architecture

```
User: <WithComponents overrides={{ Message: Custom }}>
  ↓
ComponentsContext (merges parent + overrides, inner wins)
  ↓
useComponentsContext() → { ...DEFAULT_COMPONENTS, ...overrides }
  ↓
Consumer: const { Message } = useComponentsContext()
```

### Key Files

| File | Purpose |
|------|---------|
| `ComponentsContext.tsx` | ~60 lines. `ComponentOverrides` type (derived from `typeof DEFAULT_COMPONENTS`), `WithComponents` provider, `useComponentsContext()` hook |
| `defaultComponents.ts` | ~300 lines. Single source of truth for all default component mappings. Adding a new component here auto-extends `ComponentOverrides` |

### Type System

`ComponentOverrides` is derived automatically:
```ts
export type ComponentOverrides = Partial<
  (typeof import('./defaultComponents'))['DEFAULT_COMPONENTS']
>;
```

No manual type maintenance — add a component to `DEFAULT_COMPONENTS` and the type updates.

### Circular Dependency Handling

`defaultComponents.ts` → imports components → components import `useComponentsContext` from `ComponentsContext.tsx`.

Broken by lazy-loading defaults in the hook:
```ts
let cachedDefaults: ComponentOverrides | undefined;
const getDefaults = () => {
  if (!cachedDefaults) {
    cachedDefaults = require('./defaultComponents').DEFAULT_COMPONENTS;
  }
  return cachedDefaults;
};
```

### Naming Conventions

Some component keys differ from their default component names to avoid collisions:

| Override Key | Default Component | Why renamed |
|---|---|---|
| `FileAttachmentIcon` | `FileIcon` | Clarity |
| `ChannelListLoadingIndicator` | `ChannelListLoadingIndicator` | Split from shared `LoadingIndicator` — renders skeleton UI |
| `MessageListLoadingIndicator` | `LoadingIndicator` | Split from shared `LoadingIndicator` — renders text |
| `ChatLoadingIndicator` | `undefined` | Optional, no default |
| `ThreadMessageComposer` | `MessageComposer` | Avoid collision with `MessageComposer` component name |
| `ThreadListComponent` | `DefaultThreadListComponent` | Avoid collision with exported `ThreadList` |
| `StartAudioRecordingButton` | `AudioRecordingButton` | Historical naming |
| `Preview` | `ChannelPreviewView` | ChannelList preview item |
| `PreviewAvatar` | `ChannelAvatar` | ChannelList preview avatar |
| `FooterLoadingIndicator` | `ChannelListFooterLoadingIndicator` | ChannelList footer |
| `HeaderErrorIndicator` | `ChannelListHeaderErrorIndicator` | ChannelList header |
| `HeaderNetworkDownIndicator` | `ChannelListHeaderNetworkDownIndicator` | ChannelList header |

### Optional Components (no default)

These exist in `DEFAULT_COMPONENTS` as `undefined` with `React.ComponentType<any> | undefined` type assertions:

`AttachmentPickerIOSSelectMorePhotos`, `ChatLoadingIndicator`, `CreatePollContent`, `ImageComponent`, `Input`, `ListHeaderComponent`, `MessageContentBottomView`, `MessageContentLeadingView`, `MessageContentTopView`, `MessageContentTrailingView`, `MessageLocation`, `MessageSpacer`, `MessageText`, `PollContent`

### Shared Component Keys (audited)

Some keys were used in multiple contexts before the refactor. Audit results:

| Key | Used By | Same Default? | Resolution |
|-----|---------|---------------|------------|
| `EmptyStateIndicator` | Channel + ChannelList | Yes (differentiates via `listType` prop) | Single key ✅ |
| `LoadingErrorIndicator` | Channel + ChannelList | Yes (differentiates via `listType` prop) | Single key ✅ |
| `LoadingIndicator` | Channel + ChannelList | **No** — Channel used text-based, ChannelList used skeleton | Split into `MessageListLoadingIndicator` + `ChannelListLoadingIndicator` ✅ |

### API Alignment with stream-chat-react

| Aspect | React Native | React Web |
|--------|-------------|-----------|
| Provider | `WithComponents` | `WithComponents` |
| Prop name | `overrides` | `overrides` |
| Hook | `useComponentsContext()` | `useComponentContext()` |
| Type | `ComponentOverrides` (auto-derived) | `ComponentContextValue` (hand-written) |
| Defaults | Lazy-loaded via `require()` | Set at `Channel` level |
| Merge | `useMemo` | Plain spread (no memo) |

## Known Issues / Future Work

### Pre-existing Test Failures (not caused by this work)

These test suites fail on `develop` too:
- `offline-support/index.test.ts` — timeout
- `ChannelList.test.js` — filter race condition (`channel.countUnread` mock missing)
- `isAttachmentEqualHandler.test.js`, `MessageContent.test.js`, `MessageTextContainer.test.tsx`, `MessageUserReactions.test.tsx`, `ChannelPreview.test.tsx` — various pre-existing issues

### Linter Interaction

`@typescript-eslint/no-unused-vars` (warn, max-warnings 0) aggressively strips unused type keys. When adding new keys to `ComponentOverrides`, the type and its consumer must land in the same edit — otherwise the linter removes the key between saves.

Since `ComponentOverrides` is now auto-derived from `DEFAULT_COMPONENTS`, this is no longer an issue for the type itself. But be aware when adding optional components (`undefined as React.ComponentType<any> | undefined`).

### `contexts/index.ts` Barrel Export

The `export * from './componentsContext/ComponentsContext'` line in `contexts/index.ts` was stripped by the linter multiple times during development. If `WithComponents` becomes unexportable from the package, check this barrel file first.

### Documentation

Docs PR: https://github.com/GetStream/docs-content/pull/1169

Updated ~45 pages across:
- Core teaching pages (custom_components, message-customization, etc.)
- Component reference pages (channel-list, message-list, message-composer, etc.)
- Context docs (stripped component keys from 7 context pages)
- Migration guide (upgrading-from-v8.md — comprehensive WithComponents section)
- Advanced guides (audio, AI, image-picker, etc.)

### SDK PR

https://github.com/GetStream/stream-chat-react-native/pull/3542
