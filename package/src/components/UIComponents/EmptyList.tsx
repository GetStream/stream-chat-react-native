import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons/utils/base';
import { primitives } from '../../theme';

export type EmptyListProps = {
  /**
   * Icon component to render. Its size and color are set by `EmptyList`.
   */
  icon: React.ComponentType<IconProps>;
  /**
   * Title text shown below the icon.
   */
  title: string;
  /**
   * Optional supporting text shown below the title.
   */
  subtitle?: string;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const EmptyList = ({ icon: Icon, subtitle, title }: EmptyListProps) => {
  const {
    theme: {
      emptyList: { container, subtitle: subtitleStyle, title: titleStyle },
      semantics,
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]} testID='empty-list'>
      <Icon stroke={semantics.textPrimary} size={32} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: semantics.textPrimary }, titleStyle]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: semantics.textSecondary }, subtitleStyle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

EmptyList.displayName = 'EmptyList{emptyList}';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: primitives.spacingSm,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: primitives.spacing3xl,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    gap: primitives.spacingXs,
    width: '100%',
  },
  subtitle: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightRegular,
    lineHeight: primitives.typographyLineHeightNormal,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  title: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
