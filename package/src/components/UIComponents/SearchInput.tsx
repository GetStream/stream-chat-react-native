import React, { useCallback, useState } from 'react';
import { I18nManager, StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Search } from '../../icons/search';
import { XCircle } from '../../icons/x-circle';
import { primitives } from '../../theme';

export type SearchInputProps = {
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
};

export const SearchInput = React.memo(
  ({ accessibilityLabel, onChangeText, onClear }: SearchInputProps) => {
    const { t } = useTranslationContext();
    const {
      theme: {
        searchInput: { container, input, inputFocused, textInput },
        semantics,
      },
    } = useTheme();

    const [searchText, setSearchText] = useState('');
    const [focused, setFocused] = useState(false);

    const handleChangeText = useCallback(
      (text: string) => {
        setSearchText(text);
        onChangeText(text);
      },
      [onChangeText],
    );

    const handleClear = useCallback(() => {
      setSearchText('');
      onClear();
    }, [onClear]);

    const handleFocus = useCallback(() => setFocused(true), []);
    const handleBlur = useCallback(() => setFocused(false), []);

    return (
      <View style={[styles.container, container]}>
        <View
          style={[
            styles.input,
            { borderColor: semantics.borderCoreDefault },
            input,
            focused && [{ borderColor: semantics.accentPrimary }, inputFocused],
          ]}
        >
          <Search height={20} stroke={semantics.textSecondary} width={20} />
          <TextInput
            accessibilityLabel={accessibilityLabel}
            autoCapitalize='none'
            autoCorrect={false}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            placeholder={t('Search')}
            placeholderTextColor={semantics.textSecondary}
            style={[styles.textInput, { color: semantics.textPrimary }, textInput]}
            testID='search-input'
            value={searchText}
          />
          {searchText.length > 0 ? (
            <Pressable
              accessibilityLabel={t('a11y/Clear search')}
              accessibilityRole='button'
              hitSlop={30}
              onPress={handleClear}
              testID='clear-search'
            >
              <XCircle height={15} stroke={semantics.inputTextIcon} width={15} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  },
);

SearchInput.displayName = 'SearchInput{searchInput}';

const styles = StyleSheet.create({
  container: {
    paddingBottom: primitives.spacingSm,
    paddingHorizontal: primitives.spacingMd,
    paddingTop: primitives.spacingXs,
  },
  input: {
    alignItems: 'center',
    borderRadius: primitives.radiusMax,
    borderWidth: 1,
    flexDirection: 'row',
    gap: primitives.spacingSm,
    height: 48,
    paddingHorizontal: primitives.spacingMd,
  },
  textInput: {
    flex: 1,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
    padding: 0,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
