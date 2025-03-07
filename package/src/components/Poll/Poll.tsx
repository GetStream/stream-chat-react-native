import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOption as PollOptionClass } from 'stream-chat';

import { PollButtons, PollOption } from './components';

import { usePollState } from './hooks/usePollState';

import {
  MessagesContextValue,
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../contexts';

export type PollProps = Pick<PollContextValue, 'poll' | 'message'> &
  Pick<MessagesContextValue, 'PollContent'>;

export type PollContentProps = {
  PollButtons?: React.ComponentType;
  PollHeader?: React.ComponentType;
};

export const PollHeader = () => {
  const { t } = useTranslationContext();
  const { enforceUniqueVote, isClosed, maxVotesAllowed, name } = usePollState();
  const subtitle = useMemo(() => {
    if (isClosed) {
      return t('Vote ended');
    }
    if (enforceUniqueVote) {
      return t('Select one');
    }
    if (maxVotesAllowed) {
      return t('Select up to {{count}}', { count: maxVotesAllowed });
    }
    return t('Select one or more');
  }, [isClosed, t, enforceUniqueVote, maxVotesAllowed]);

  const {
    theme: {
      colors: { text_high_emphasis, text_low_emphasis },
      poll: {
        message: { header },
      },
    },
  } = useTheme();

  return (
    <>
      <Text style={[styles.headerTitle, { color: text_high_emphasis }, header.title]}>{name}</Text>
      <Text style={[styles.headerSubtitle, { color: text_low_emphasis }, header.subtitle]}>
        {subtitle}
      </Text>
    </>
  );
};

export const PollContent = ({
  PollButtons: PollButtonsOverride,
  PollHeader: PollHeaderOverride,
}: PollContentProps) => {
  const { options } = usePollState();

  const {
    theme: {
      poll: {
        message: { container, optionsWrapper },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {PollHeaderOverride ? <PollHeaderOverride /> : <PollHeader />}
      <View style={[styles.optionsWrapper, optionsWrapper]}>
        {options
          ?.slice(0, 10)
          ?.map((option: PollOptionClass) => (
            <PollOption key={`message_poll_option_${option.id}`} option={option} />
          ))}
      </View>
      {PollButtonsOverride ? <PollButtonsOverride /> : <PollButtons />}
    </View>
  );
};

export const Poll = ({ message, poll, PollContent: PollContentOverride }: PollProps) => (
  <PollContextProvider
    value={{
      message,
      poll,
    }}
  >
    {PollContentOverride ? <PollContentOverride /> : <PollContent />}
  </PollContextProvider>
);

const styles = StyleSheet.create({
  container: { padding: 15, width: 270 },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  optionsWrapper: { marginTop: 12 },
});
