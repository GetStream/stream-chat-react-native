import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useCreatePollContentContext } from '../../../contexts/pollContext/createPollContentContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { SendPoll } from '../../../icons';
import { PollModalHeader } from '../components';
import { useCanCreatePoll } from '../hooks/useCanCreatePoll';

export const CreatePollHeader = () => {
  const { t } = useTranslationContext();

  const messageComposer = useMessageComposer();
  const canCreatePoll = useCanCreatePoll();
  const { pollComposer } = messageComposer;
  const { closePollCreationDialog, createAndSendPoll } = useCreatePollContentContext();

  const {
    theme: {
      colors: { white },
      poll: {
        createContent: { headerContainer, sendButton },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: white }, headerContainer]}>
      <PollModalHeader
        onPress={() => {
          pollComposer.initState();
          closePollCreationDialog?.();
        }}
        title={t('Create Poll')}
      />
      <Pressable
        disabled={!canCreatePoll}
        onPress={async () => {
          await createAndSendPoll();
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, styles.sendButton, sendButton]}
      >
        <SendPoll
          height={24}
          pathFill={canCreatePoll ? '#005DFF' : '#B4BBBA'}
          viewBox='0 0 24 24'
          width={24}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  sendButton: { paddingHorizontal: 16, paddingVertical: 18 },
});
