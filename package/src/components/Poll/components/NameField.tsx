import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';

export const NameField = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;

  const {
    theme: {
      colors: { bg_user, black },
      poll: {
        createContent: { name },
      },
    },
  } = useTheme();

  const onChangeText = useCallback(
    async (newText: string) => {
      await pollComposer.updateFields({ name: newText });
    },
    [pollComposer],
  );

  const onBlur = useCallback(async () => {
    await pollComposer.handleFieldBlur('name');
  }, [pollComposer]);

  return (
    <View>
      <Text style={[styles.text, { color: black }, name.title]}>{t<string>('Questions')}</Text>
      <TextInput
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={t('Ask a question')}
        style={[
          styles.textInputWrapper,
          styles.text,
          { backgroundColor: bg_user, color: black },
          name.input,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  text: { fontSize: 16 },
  textInputWrapper: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
});
