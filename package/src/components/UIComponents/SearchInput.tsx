import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Search } from '../../icons/search';
import { XCircle } from '../../icons/x-circle';
import { primitives } from '../../theme';
import type { IconRenderer } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';

export type SearchInputProps = {
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const SearchInput = ({ accessibilityLabel, onChangeText, onClear }: SearchInputProps) => {
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();

  const [searchText, setSearchText] = useState('');

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

  const LeadingIcon: IconRenderer = useCallback(
    () => <Search height={20} stroke={semantics.textSecondary} width={20} />,
    [semantics.textSecondary],
  );

  const ClearIcon: IconRenderer = useCallback(
    () => (
      <Pressable
        accessibilityLabel={t('a11y/Clear search')}
        accessibilityRole='button'
        hitSlop={30}
        onPress={handleClear}
        testID='clear-search'
      >
        <XCircle height={15} stroke={semantics.inputTextIcon} width={15} />
      </Pressable>
    ),
    [handleClear, semantics.inputTextIcon, t],
  );

  return (
    <View style={styles.container}>
      <Input
        accessibilityLabel={accessibilityLabel}
        autoCapitalize='none'
        autoCorrect={false}
        containerStyle={styles.input}
        helperText={false}
        LeadingIcon={LeadingIcon}
        onChangeText={handleChangeText}
        placeholder={t('Search')}
        testID='search-input'
        TrailingIcon={searchText.length > 0 ? ClearIcon : undefined}
        value={searchText}
        variant='outline'
      />
    </View>
  );
};

SearchInput.displayName = 'SearchInput{searchInput}';

const styles = StyleSheet.create({
  container: {
    paddingBottom: primitives.spacingSm,
    paddingHorizontal: primitives.spacingMd,
    paddingTop: primitives.spacingXs,
  },
  input: {
    borderRadius: primitives.radiusMax,
  },
});
