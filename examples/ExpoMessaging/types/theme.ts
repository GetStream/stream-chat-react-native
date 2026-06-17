import type { Theme } from 'stream-chat-expo';

/**
 * The SDK's `Theme` type no longer has a top-level `colors` palette (it moved to a
 * semantics/primitives token model). This app, however, injects a custom `colors`
 * palette at runtime via `<OverlayProvider value={{ style }}>` (see `useStreamChatTheme`),
 * so `theme.colors` does exist at runtime. `AppTheme` augments the SDK type to reflect
 * that runtime shape so components can read `theme.colors.X` without migrating the colors.
 */
export type AppTheme = Theme & { colors: Record<string, string> };
