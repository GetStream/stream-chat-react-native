import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Search } from '../../icons/search';
import { XCircle } from '../../icons/x-circle';
import { primitives } from '../../theme';
import type { IconRenderer } from '../ui/Button/Button';
import { Input, InputProps } from '../ui/Input/Input';

export type SearchInputProps = Partial<InputProps>;

/**
 * @experimental This component is experimental and is subject to change.
 */
export const SearchInput = ({ onChangeText, ...props }: SearchInputProps) => {
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();

  const inputRef = useRef<TextInput>(null);
  const [hasText, setHasText] = useState(() => Boolean(props.value || props.defaultValue));

  const handleChangeText = useCallback(
    (text: string) => {
      setHasText(text.length > 0);
      onChangeText?.(text);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    inputRef.current?.clear();
    setHasText(false);
    onChangeText?.('');
  }, [onChangeText]);

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
        ref={inputRef}
        autoCapitalize='words'
        autoCorrect={false}
        containerStyle={styles.input}
        helperText={false}
        LeadingIcon={LeadingIcon}
        placeholder={t('Search')}
        testID='search-input'
        TrailingIcon={hasText ? ClearIcon : undefined}
        variant='outline'
        {...props}
        onChangeText={handleChangeText}
      />
    </View>
  );
};

SearchInput.displayName = 'SearchInput{searchInput}';

const styles = StyleSheet.create({
  container: {
    padding: primitives.spacingMd,
  },
  input: {
    borderRadius: primitives.radiusMax,
  },
});
