import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Search } from '../../icons/search';
import { primitives } from '../../theme';

export type EmptySearchResultProps = {
  label: string;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const EmptySearchResult = ({ label }: EmptySearchResultProps) => {
  const {
    theme: {
      emptySearchResult: { container, text },
      semantics,
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]} testID='empty-search-result'>
      <Search height={24} stroke={semantics.textTertiary} width={24} />
      <Text style={[styles.text, { color: semantics.textSecondary }, text]}>{label}</Text>
    </View>
  );
};

EmptySearchResult.displayName = 'EmptySearchResult{emptySearchResult}';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: primitives.spacingSm,
    height: '100%',
    justifyContent: 'center',
    paddingVertical: primitives.spacingXl,
    width: '100%',
  },
  text: {
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightRegular,
    lineHeight: primitives.typographyLineHeightNormal,
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
