import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { SendPoll } from '../../../icons';
import { PollModalHeader } from '../components';
import { useCanCreatePoll } from '../hooks/useCanCreatePoll';

export type CreatePollHeaderProps = {
  /**
   * Handler for back button press
   * @returns void
   */
  onBackPressHandler: () => void;
  /**
   * Handler for create poll button press
   * @returns void
   */
  onCreatePollPressHandler: () => void;
};

export const CreatePollHeader = ({
  onBackPressHandler,
  onCreatePollPressHandler,
}: CreatePollHeaderProps) => {
  const { t } = useTranslationContext();

  const canCreatePoll = useCanCreatePoll();

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
      <PollModalHeader onPress={onBackPressHandler} title={t('Create Poll')} />
      <Pressable
        disabled={!canCreatePoll}
        onPress={onCreatePollPressHandler}
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
