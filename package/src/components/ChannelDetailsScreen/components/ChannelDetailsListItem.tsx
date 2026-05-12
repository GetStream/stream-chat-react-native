import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

export type ChannelDetailsListItemProps = {
  Icon: React.ComponentType<IconProps>;
  label: string;
  accessibilityHint?: string;
  destructive?: boolean;
  onPress?: () => void;
  testID?: string;
  trailing?: React.ReactNode;
};

export const ChannelDetailsListItem = ({
  accessibilityHint,
  Icon,
  destructive = false,
  label,
  onPress,
  testID,
  trailing,
}: ChannelDetailsListItemProps) => {
  const {
    theme: {
      channelDetailsScreen: {
        listItem: {
          container: containerOverride,
          destructiveLabel: destructiveLabelOverride,
          iconWrapper: iconWrapperOverride,
          label: labelOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const labelColor = destructive ? semantics.accentError : semantics.textPrimary;
  const iconColor = destructive ? semantics.accentError : semantics.textPrimary;

  const content = (
    <View style={[styles.contentContainer, containerOverride]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={[styles.iconWrapper, iconWrapperOverride]}
      >
        <Icon fill={iconColor} height={20} stroke={iconColor} width={20} />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: labelColor },
          labelOverride,
          destructive ? destructiveLabelOverride : null,
        ]}
      >
        {label}
      </Text>
      {trailing ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          style={styles.trailing}
        >
          {trailing}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
      ]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: primitives.spacingSm,
          minHeight: 48,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
        iconWrapper: {
          alignItems: 'center',
          height: 20,
          justifyContent: 'center',
          width: 20,
        },
        label: {
          flex: 1,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 48,
          paddingHorizontal: primitives.spacingXxs,
        },
        trailing: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
      }),
    [],
  );
};
