import type { Colors, Theme } from 'stream-chat-react-native';

/**
 * The SampleApp injects a custom `colors` palette at runtime via
 * `<ThemeProvider style={streamChatTheme}>` (see `useStreamChatTheme`).
 * The SDK's `Theme` type no longer exposes a top-level `colors` map (it moved
 * to the semantics/primitives token model), so this alias re-augments the theme
 * with that runtime palette for the call sites that still read `theme.colors`.
 *
 * The injected palette is the legacy `Colors` object, so we type it as such to
 * stay accurate for consumers that expect the legacy color keys.
 */
export type StreamThemeWithColors = Theme & { colors: typeof Colors };
