import React, { useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import type { RoleLabel } from '../../hooks/members/useMemberRoles';

export type RoleItemProps = {
  role: RoleLabel;
  /** Style of the badge label, applied after the theme override. */
  textStyle?: StyleProp<TextStyle>;
  /** Style of the badge container, applied after the theme override. */
  viewStyle?: StyleProp<ViewStyle>;
};

/**
 * A role badge shown next to a member row. The `owner` role uses the accent palette and every other
 * role the neutral one.
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
