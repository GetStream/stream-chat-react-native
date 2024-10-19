import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

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

import { PollContextProvider, useChannelContext, useMessageContext } from '../../contexts';

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

const PollWithContext = () => {
  const { PollButtons: PollButtonsOverride } = useChannelContext();
  const { enforce_unique_vote, is_closed, max_votes_allowed, name, options } = usePollState();
  const subtitle = useMemo(() => {
    if (is_closed) return 'Vote ended';
    if (enforce_unique_vote) return 'Select one';
    if (max_votes_allowed) return `Select up to ${max_votes_allowed}`;
    return 'Select one or more';
  }, [is_closed, enforce_unique_vote, max_votes_allowed]);

  return (
    <View style={{ padding: 15, width: 270 }}>
      <Text style={{ color: '#080707', fontSize: 16, fontWeight: '500' }}>{name}</Text>
      <Text style={{ color: '#7E828B', fontSize: 12 }}>{subtitle}</Text>
      <View style={{ marginTop: 12 }}>
        {options?.slice(0, 10)?.map((option: PollOptionClass) => (
          <PollOption key={`message_poll_option_${option.id}`} option={option} />
        ))}
      </View>
      {PollButtonsOverride ? <PollButtonsOverride /> : <PollButtons />}
    </View>
  );
};

export const Poll = ({ poll }: { poll: PollClass }) => {
  const { message } = useMessageContext();

  return (
    <PollContextProvider
      value={{
        message,
        poll,
      }}
    >
      <PollWithContext />
    </PollContextProvider>
  );
};
