import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PollComposerState } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.name,
  name: state.data.name,
});

export const NameField = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { name: pollName } = useStateStore(pollComposer.state, pollComposerStateSelector);

  const {
    theme: {
      colors: { bg_user, black },
      poll: {
        createContent: { name },
      },
    },
  } = useTheme();

  return (
    <View>
      <Text style={[styles.text, { color: black }, name.title]}>{t<string>('Questions')}</Text>
      <TextInput
        onBlur={() => pollComposer.handleFieldBlur('name')}
        onChangeText={(text) => pollComposer.updateFields({ name: text })}
        placeholder={t('Ask a question')}
        style={[
          styles.textInputWrapper,
          styles.text,
          { backgroundColor: bg_user, color: black },
          name.input,
        ]}
        value={pollName}
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
