import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Poll as PollClass, PollOption as PollOptionClass } from 'stream-chat';

import {
  AddCommentButton,
  EndVoteButton,
  PollOption,
  ShowAllCommentsButton,
  ShowAllOptionsButton,
  SuggestOptionButton,
  ViewResultsButton,
} from './components';

import { usePollState } from './hooks/usePollState';

import {
  PollContextProvider,
  useChannelContext,
  useMessageContext,
  useTheme,
  useTranslationContext,
} from '../../contexts';

export const PollButtons = () => (
  <>
    <ShowAllOptionsButton />
    <ShowAllCommentsButton />
    <SuggestOptionButton />
    <AddCommentButton />
    <ViewResultsButton />
    <EndVoteButton />
  </>
);

export const PollHeader = () => {
  const { t } = useTranslationContext();
  const { enforce_unique_vote, is_closed, max_votes_allowed, name } = usePollState();
  const subtitle = useMemo(() => {
    if (is_closed) return t('Vote ended');
    if (enforce_unique_vote) return t('Select one');
    if (max_votes_allowed) return t('Select up to {{count}}', { count: max_votes_allowed });
    return t('Select one or more');
  }, [is_closed, t, enforce_unique_vote, max_votes_allowed]);

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

const PollWithContext = () => {
  const { PollButtons: PollButtonsOverride, PollHeader: PollHeaderOverride } = useChannelContext();
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
        {options?.slice(0, 10)?.map((option: PollOptionClass) => (
          <PollOption key={`message_poll_option_${option.id}`} option={option} />
        ))}
      </View>
      {PollButtonsOverride ? <PollButtonsOverride /> : <PollButtons />}
    </View>
  );
};

export const Poll = ({ poll }: { poll: PollClass }) => {
  const { Poll: PollOverride } = useChannelContext();
  const { message } = useMessageContext();

  return (
    <PollContextProvider
      value={{
        message,
        poll,
      }}
    >
      {PollOverride ? <PollOverride /> : <PollWithContext />}
    </PollContextProvider>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, width: 270 },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  optionsWrapper: { marginTop: 12 },
});