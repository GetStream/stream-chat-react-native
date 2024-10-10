import React, { useCallback, useMemo } from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

import { PollOption as PollOptionClass, PollState, PollVote } from 'stream-chat';

import { useMessageContext, usePollContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';

import { Avatar } from '../../Avatar/Avatar';

const selector = (nextValue: PollState) =>
  [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds] as const;

export type PollOptionProps = {
  option: PollOptionClass;
};

export const PollOption = ({ option }: PollOptionProps) => {
  const { optionVoteCounts, ownVotesByOptionId, poll } = usePollContext();
  const { message } = useMessageContext();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id], message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const [latestVotesByOption, maxVotedOptionIds] = useStateStore(poll.state, selector);

  const relevantVotes = useMemo(
    () => latestVotesByOption[option.id]?.slice(0, 2) || [],
    [latestVotesByOption, option.id],
  );
  const maxVotes = useMemo(
    () => (maxVotedOptionIds?.[0] && optionVoteCounts ? optionVoteCounts[maxVotedOptionIds[0]] : 0),
    [maxVotedOptionIds, optionVoteCounts],
  );
  const votes = optionVoteCounts[option.id] || 0;
  // TODO: Just a reminder to take care of offline mode.
  // useEffect(() => {
  //   const pollState = poll.state.getLatestValue();
  //   dbApi.updateMessage({
  //     message: {
  //       ...message,
  //       poll_id: poll.id,
  //       poll: { ...pollState, own_votes: pollState.ownVotes, id: poll.id },
  //     },
  //   });
  // }, [optionVoteCounts]);

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={toggleVote}
          style={{
            backgroundColor: ownVotesByOptionId[option.id] ? 'red' : 'white',
            borderColor: 'black',
            borderWidth: 1,
            height: 15,
            width: 15,
          }}
        />
        <Text style={{ flex: 1 }}>{option.text}</Text>
        <View style={{ flexDirection: 'row' }}>
          {relevantVotes.map((vote: PollVote) => (
            <Avatar
              // containerStyle={{ position: 'absolute', right: index * 15 }}
              image={vote.user?.image as string}
              key={vote.id}
              size={20}
            />
          ))}
          <Text style={{ marginLeft: 2 }}>{optionVoteCounts[option.id] || 0}</Text>
        </View>
      </View>
      <View style={{ borderRadius: 4, flex: 1, flexDirection: 'row', height: 4 }}>
        <View style={{ backgroundColor: '#005DFF', flex: maxVotes > 0 ? votes / maxVotes : 0 }} />
        <View
          style={{
            backgroundColor: 'grey',
            flex: maxVotes > 0 ? (maxVotes - votes) / maxVotes : 1,
          }}
        />
      </View>
    </View>
  );
};
