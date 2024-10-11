import React, { useCallback, useMemo } from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollOption as PollOptionClass, PollState, PollVote } from 'stream-chat';

import { VoteButton } from './Button';

import { useMessageContext, usePollContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';

import { Avatar } from '../../Avatar/Avatar';

const selector = (nextValue: PollState) =>
  [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds] as const;

export type PollOptionProps = {
  option: PollOptionClass;
  showProgressBar?: boolean;
};

export type ShowAllOptionsContentProps = {
  close: () => void;
};

export const ShowAllOptionsContent = ({ close }: ShowAllOptionsContentProps) => {
  const { name, options } = usePollContext();

  return (
    <>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={close}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>Poll Options</Text>
      </View>
      <ScrollView style={{ flex: 1, marginBottom: 16, padding: 16 }}>
        <View
          style={{
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '500' }}>{name}</Text>
        </View>
        <View
          style={{
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            marginTop: 32,
            paddingBottom: 18,
            paddingHorizontal: 16,
          }}
        >
          {options?.map((option: PollOptionClass) => (
            <View key={`full_poll_options_${option.id}`} style={{ paddingVertical: 16 }}>
              <PollOption key={option.id} option={option} showProgressBar={false} />
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export const PollOption = ({ option, showProgressBar = true }: PollOptionProps) => {
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
      {showProgressBar ? (
        <View style={{ borderRadius: 4, flex: 1, flexDirection: 'row', height: 4, marginTop: 2 }}>
          <View style={{ backgroundColor: '#005DFF', flex: maxVotes > 0 ? votes / maxVotes : 0 }} />
          <View
            style={{
              backgroundColor: 'grey',
              flex: maxVotes > 0 ? (maxVotes - votes) / maxVotes : 1,
            }}
          />
        </View>
      ) : null}
    </View>
  );
};
