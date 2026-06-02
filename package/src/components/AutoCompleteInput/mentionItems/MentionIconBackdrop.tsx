import React, { ReactNode, useMemo } from 'react';
import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

export type MentionIconBackdropProps = {
  /**
   * Resolved background color for the icon backdrop (typically a semantic
   * chatBgMention* token). Defaults to transparent.
   */
  backgroundColor?: ColorValue;
  /**
   * Outer width/height of the backdrop in px. Matches the user avatar size by
   * default so all mention rows align visually.
   */
  size?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Square rounded backdrop that sits where the user avatar would, used by
 * non-user mention rows (channel/here/role/group) to host the type icon.
 */
export const MentionIconBackdrop = ({
  backgroundColor,
  children,
  size = 40,
  style,
}: MentionIconBackdropProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles(size, backgroundColor ?? semantics.chatBgMention);

  return <View style={[styles.backdrop, style]}>{children}</View>;
};

const useStyles = (size: number, backgroundColor: ColorValue) =>
  useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          alignItems: 'center',
          backgroundColor,
          borderRadius: size / 2,
          height: size,
          justifyContent: 'center',
          width: size,
        },
      }),
    [size, backgroundColor],
  );
