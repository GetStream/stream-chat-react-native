import React, { useCallback, useMemo } from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

import { PollOption as PollOptionClass, PollState, PollVote } from 'stream-chat';

import { VoteButton } from './Button';

import { useMessageContext, usePollContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';

import { Check } from '../../../icons';
import { Avatar } from '../../Avatar/Avatar';

const selector = (nextValue: PollState) =>
  [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds] as const;

export type PollOptionProps = {
  option: PollOptionClass;
};

export type ShowAllOptionsContentProps = {
  close: () => void;
};

export const ShowAllOptionsContent = ({ close }: ShowAllOptionsContentProps) => {
  const { name, options } = usePollContext();

  return (
    <>
      <TouchableOpacity onPress={close}>
        <Text>BACK</Text>
      </TouchableOpacity>
      <Text>{name}</Text>
      {options?.map((option: PollOptionClass) => (
        <PollOption key={option.id} option={option} />
      ))}
    </>
  );
};

export const PollOption = ({ option }: PollOptionProps) => {
  const { ownVotesByOptionId, poll, vote_counts_by_option } = usePollContext();
  const { message } = useMessageContext();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id], message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const [latest_votes_by_option, maxVotedOptionIds] = useStateStore(poll.state, selector);

  const relevantVotes = useMemo(
    () => latest_votes_by_option?.[option.id]?.slice(0, 2) || [],
    [latest_votes_by_option, option.id],
  );
  const maxVotes = useMemo(
    () =>
      maxVotedOptionIds?.[0] && vote_counts_by_option
        ? vote_counts_by_option[maxVotedOptionIds[0]]
        : 0,
    [maxVotedOptionIds, vote_counts_by_option],
  );
  const votes = vote_counts_by_option[option.id] || 0;
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
  // }, [vote_counts_by_option]);

  return (
    <View style={{ marginTop: 8, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row' }}>
        <VoteButton onPress={toggleVote} option={option} />
        <Text style={{ flex: 1, fontSize: 16, marginLeft: 4 }}>{option.text}</Text>
        <View style={{ flexDirection: 'row' }}>
          {relevantVotes.map((vote: PollVote) => (
            <Avatar
              // containerStyle={{ position: 'absolute', right: index * 15 }}
              image={vote.user?.image as string}
              key={vote.id}
              size={20}
            />
          ))}
          <Text style={{ marginLeft: 2 }}>{vote_counts_by_option[option.id] || 0}</Text>
        </View>
      </View>
      <View style={{ borderRadius: 4, flex: 1, flexDirection: 'row', height: 4, marginTop: 2 }}>
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
