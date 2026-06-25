import React, { useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import type { RoleLabel } from '../../hooks/members/useMemberRoles';

export type RoleItemProps = {
  role: RoleLabel;
  /** Style applied to the badge label, layered over the theme override. */
  textStyle?: StyleProp<TextStyle>;
  /** Style applied to the badge container, layered over the theme override. */
  viewStyle?: StyleProp<ViewStyle>;
};

/**
 * Renders a single role badge (pill) next to a member row. `owner` roles use the accent
 * (blue) palette; every other role uses the neutral (grey) palette.
 *
 * @experimental This component is experimental and is subject to change.
 */
export const RoleItem = ({ role, textStyle, viewStyle }: RoleItemProps) => {
  const {
    theme: {
      channelDetails: {
        roleItem: {
          container: containerOverride,
          ownerBackgroundColor,
          ownerColor,
          roleBackgroundColor,
          roleColor,
          text: textOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const isOwner = role.key === 'owner';
  const backgroundColor = isOwner
    ? ownerBackgroundColor || semantics.brand150
    : roleBackgroundColor || semantics.backgroundCoreSurfaceStrong;
  const color = isOwner ? ownerColor || semantics.brand900 : roleColor || semantics.textPrimary;

  return (
    <View style={[styles.container, { backgroundColor }, containerOverride, viewStyle]}>
      <Text numberOfLines={1} style={[styles.text, { color }, textOverride, textStyle]}>
        {role.label}
      </Text>
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          borderRadius: 14,
          flexShrink: 0,
          justifyContent: 'center',
          paddingHorizontal: primitives.spacingXs,
          paddingVertical: 0,
        },
        text: {
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightMedium,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [],
  );
