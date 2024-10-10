import React, { useState } from 'react';
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import { PollOptionFullResults } from './PollOptionFullResults';

import { PollOption, PollVote } from '../../../../../../stream-chat-js';
import { usePollContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar } from '../../Avatar/Avatar';

export type PollResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  option: PollOption<StreamChatGenerics>;
};

export const PollResultsItem = ({ option }: PollResultItemProps) => {
  const { latestVotesByOption, optionVoteCounts } = usePollContext();
  const [showAllVotes, setShowAllVotes] = useState(false);
  return (
    <View
      key={`results_${option.id}`}
      style={{
        backgroundColor: '#F7F7F8',
        borderRadius: 12,
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>{option.text}</Text>
        <Text>{optionVoteCounts[option.id] ?? 0} votes</Text>
      </View>
      {(latestVotesByOption?.[option.id] ?? []).map((vote: PollVote) => (
        <View
          key={`results_vote_${vote.id}`}
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row' }}>
            <Avatar
              // containerStyle={{ position: 'absolute', right: index * 15 }}
              image={vote.user?.image as string}
              key={vote.id}
              size={20}
            />
            <Text>{vote.user?.name}</Text>
          </View>
          <Text>{vote.created_at}</Text>
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setShowAllVotes(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>View Results</Text>
      </TouchableOpacity>
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
            <PollOptionFullResults close={() => setShowAllVotes(false)} option={option} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
};
