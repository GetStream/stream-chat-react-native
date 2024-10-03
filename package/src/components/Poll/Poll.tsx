import React from 'react';
import { Text } from 'react-native';

import { Poll as PollClass, PollState } from 'stream-chat';

import {
  PollContextProvider,
  useChatContext,
  useMessageContext,
  usePollContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: PollState) => [nextValue.name, nextValue.created_at] as const;

const PollWithContext = () => {
  const { poll } = usePollContext();
  const [pollName, creationDate] = useStateStore(poll.state, selector);

  return <Text>{`${pollName} ${creationDate}`}</Text>;
};

export const Poll = () => {
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const { poll: pollData } = message;
  if (pollData == null) {
    return null;
  }
  const poll = new PollClass({ client, poll: pollData });
  return (
    <PollContextProvider value={{ poll }}>
      <PollWithContext />
    </PollContextProvider>
  );
};
