import React from 'react';
import { Text, View } from 'react-native';

import { Poll as PollClass, PollState } from 'stream-chat';

import {
  PollContextProvider,
  useChatContext,
  useMessageContext,
  usePollContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: PollState) =>
  [
    nextValue.vote_counts_by_option,
    nextValue.options,
    nextValue.name,
    nextValue.max_votes_allowed,
  ] as const;

const PollWithContext = () => {
  // const { maxNumberOfVotes, name, options, optionVoteCounts, poll } = usePollContext();
  const { poll } = usePollContext();
  const [optionVoteCounts, options, name, maxNumberOfVotes] = useStateStore(poll.state, selector);
  // if (maxNumberOfVotes === 1) return 'Select one';
  const subtitle = maxNumberOfVotes ? `Select up to ${maxNumberOfVotes}` : 'Select one or more';

  return (
    <View style={{ padding: 15 }}>
      <Text>{name}</Text>
      <Text>{subtitle}</Text>
      {options?.map((option) => (
        <View style={{ flexDirection: 'row' }}>
          <Text>{option.text}</Text>
          <Text style={{ marginLeft: 10 }}>{optionVoteCounts[option.id]}</Text>
        </View>
      ))}
    </View>
  );
};

export const Poll = () => {
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const { poll: pollData } = message;

  const poll = new PollClass({ client, poll: pollData || {} });
  // const [optionVoteCounts, options, name, maxNumberOfVotes] = useStateStore(poll.state, selector);
  return (
    <PollContextProvider value={{ poll }}>
      <PollWithContext />
    </PollContextProvider>
  );
};
