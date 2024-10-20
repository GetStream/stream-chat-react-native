import React, { useCallback, useMemo } from 'react';

import { ScrollViewProps, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollOption as PollOptionClass, PollState, PollVote } from 'stream-chat';

import { VoteButton } from './Button';

import {
  PollContextProvider,
  PollContextValue,
  useMessageContext,
  usePollContext,
} from '../../../contexts';

import { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar } from '../../Avatar/Avatar';
import { usePollState } from '../hooks/usePollState';
import { usePollStateStore } from '../hooks/usePollStateStore';

type PollOptionSelectorReturnValue = [Record<string, PollVote[]>, string[]];

const selector = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  nextValue: PollState<StreamChatGenerics>,
): PollOptionSelectorReturnValue => [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds];

export type PollOptionProps = {
  option: PollOptionClass;
  showProgressBar?: boolean;
};

export type PollAllOptionsContentProps = PollContextValue & {
  additionalScrollViewProps?: Partial<ScrollViewProps>;
  PollAllOptionsContent?: React.ComponentType;
};

export const PollAllOptionsContent = ({
  additionalScrollViewProps,
}: Pick<PollAllOptionsContentProps, 'additionalScrollViewProps'>) => {
  const { name, options } = usePollState();

  return (
    <ScrollView style={{ flex: 1, marginBottom: 16, padding: 16 }} {...additionalScrollViewProps}>
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
  );
};

export const PollAllOptions = ({
  additionalScrollViewProps,
  message,
  poll,
  PollAllOptionsContent: PollAllOptionsContentOverride,
}: PollAllOptionsContentProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollAllOptionsContentOverride ? (
      <PollAllOptionsContentOverride />
    ) : (
      <PollAllOptionsContent additionalScrollViewProps={additionalScrollViewProps} />
    )}
  </PollContextProvider>
);

export const PollOption = ({ option, showProgressBar = true }: PollOptionProps) => {
  const { is_closed, ownVotesByOptionId, vote_counts_by_option } = usePollState();
  const { poll } = usePollContext();
  const { message } = useMessageContext();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id], message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const [latest_votes_by_option, maxVotedOptionIds] = usePollStateStore(selector);

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
  // with the latest llc changes this seems to be working just fine.
  // todo: continue testing thoroughly to make sure.
  // useEffect(() => {
  //   if (enableOfflineSupport) {
  //     const pollState = poll.data;
  //     dbApi.updateMessage({
  //       message: {
  //         ...message,
  //         // TODO: set the poll response properly here
  //         poll: {
  //           ...pollState,
  //           id: poll.id,
  //           own_votes: pollState.ownVotes,
  //         },
  //         poll_id: poll.id,
  //       },
  //     });
  //   }
  // }, [enableOfflineSupport, message, poll, vote_counts_by_option]);

  return (
    <View style={{ marginTop: 8, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row' }}>
        <VoteButton onPress={toggleVote} option={option} />
        <Text style={{ flex: 1, fontSize: 16, marginLeft: 4 }}>{option.text}</Text>
        <View style={{ flexDirection: 'row' }}>
          {relevantVotes.map((vote: PollVote) => (
            <Avatar image={vote.user?.image as string} key={vote.id} size={20} />
          ))}
          <Text style={{ marginLeft: 2 }}>{vote_counts_by_option[option.id] || 0}</Text>
        </View>
      </View>
      {showProgressBar ? (
        <View style={{ borderRadius: 4, flex: 1, flexDirection: 'row', height: 4, marginTop: 2 }}>
          <View
            style={{
              backgroundColor:
                is_closed && maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === option.id
                  ? '#1FE06F'
                  : '#005DFF',
              flex: maxVotes > 0 ? votes / maxVotes : 0,
            }}
          />
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
