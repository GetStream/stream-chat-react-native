import React, { useState } from 'react';
import { Modal, SafeAreaView, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollOptionFullResults } from './PollOptionFullResults';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { Avatar } from '../../../Avatar/Avatar';
import { usePollState } from '../../hooks/usePollState';
import { ShowAllVotesButton } from '../Button';

export type PollResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  option: PollOption<StreamChatGenerics>;
};

export const PollVote = (vote: PollVoteClass) => (
  <View
    key={`results_vote_${vote.id}`}
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingVertical: 8,
    }}
  >
    <View style={{ flexDirection: 'row' }}>
      <Avatar image={vote.user?.image as string} key={vote.id} size={20} />
      <Text style={{ fontSize: 14, marginLeft: 2 }}>{vote.user?.name}</Text>
    </View>
    <Text style={{ color: '#7E828B', fontSize: 14 }}>{vote.created_at}</Text>
  </View>
);

export const PollResultsItem = ({ option }: PollResultItemProps) => {
  const { latest_votes_by_option, vote_counts_by_option } = usePollState();
  const [showAllVotes, setShowAllVotes] = useState(false);
  return (
    <View
      style={{
        backgroundColor: '#F7F7F8',
        borderRadius: 12,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '500' }}>{option.text}</Text>
        <Text style={{ fontSize: 16, marginLeft: 16 }}>
          {vote_counts_by_option[option.id] ?? 0} votes
        </Text>
      </View>
      {latest_votes_by_option?.[option.id]?.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          {(latest_votes_by_option?.[option.id] ?? []).slice(0, 5).map(PollVote)}
        </View>
      ) : null}
      <ShowAllVotesButton onPress={() => setShowAllVotes(true)} option={option} />
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <PollOptionFullResults close={() => setShowAllVotes(false)} option={option} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
};
