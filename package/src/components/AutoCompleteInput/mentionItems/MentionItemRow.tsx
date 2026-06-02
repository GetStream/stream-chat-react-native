import React, { PropsWithChildren, ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type MentionItemRowProps = PropsWithChildren<{
  /**
   * Optional leading visual (Avatar, icon backdrop, etc.).
   */
  leading?: ReactNode;
  /**
   * Optional trailing visual (e.g. member count for groups).
   */
  trailing?: ReactNode;
  /**
   * Optional subtitle rendered under the title.
   */
  subtitle?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  testID?: string;
}>;

/**
 * Shared horizontal-row layout used by every mention-suggestion subtype:
 * leading slot (avatar or icon backdrop), title column (children), optional
 * subtitle line under the title, optional trailing slot. Mirrors the layout
 * the user-only row already used so the visual rhythm stays consistent.
 */
export const MentionItemRow = ({
  children,
  columnStyle,
  containerStyle,
  leading,
  subtitle,
  subtitleStyle,
  testID,
  trailing,
}: MentionItemRowProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {leading}
      <View style={[styles.column, columnStyle]}>
        {children}
        {subtitle ? (
          <Text style={[styles.subtitle, { color: semantics.textSecondary }, subtitleStyle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        column: {
          flex: 1,
          justifyContent: 'space-evenly',
          paddingLeft: 8,
        },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        subtitle: {
          fontSize: primitives.typographyFontSizeSm,
          lineHeight: primitives.typographyLineHeightTight,
          marginTop: 2,
        },
      }),
    [],
  );
