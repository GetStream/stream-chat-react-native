import { useMemo } from 'react';
import { useTheme } from 'stream-chat-react-native';

export const useLegacyColors = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () => ({
      accent_blue: semantics.accentPrimary,
      accent_red: semantics.accentError,
      bg_gradient_end: semantics.backgroundCoreSurface,
      bg_gradient_start: semantics.backgroundCoreSurfaceSubtle,
      black: semantics.textPrimary,
      button_background: semantics.buttonPrimaryBg,
      button_text: semantics.buttonPrimaryTextOnAccent,
      grey: semantics.textSecondary,
      grey_gainsboro: semantics.borderCoreDefault,
      grey_whisper: semantics.backgroundCoreSurface,
      icon_background: semantics.backgroundCoreApp,
      overlay: semantics.badgeBgOverlay,
      white: semantics.backgroundCoreApp,
      white_smoke: semantics.backgroundCoreSurfaceSubtle,
      white_snow: semantics.backgroundCoreApp,
    }),
    [semantics],
  );
};
