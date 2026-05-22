import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { Spinner } from './Spinner';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type EmptySearchResultProps = {
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
};

export const EmptySearchResult = React.memo(
  ({ icon, label, loading = false }: EmptySearchResultProps) => {
    const {
      theme: {
        emptySearchResult: { container, text },
        semantics,
      },
    } = useTheme();

    if (loading) {
      return (
        <View style={[styles.container, container]} testID='empty-search-result-loading'>
          <Spinner height={24} width={24} />
        </View>
      );
    }

    return (
      <View style={[styles.container, container]} testID='empty-search-result'>
        {icon}
        <Text style={[styles.text, { color: semantics.textSecondary }, text]}>{label}</Text>
      </View>
    );
  },
);

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
