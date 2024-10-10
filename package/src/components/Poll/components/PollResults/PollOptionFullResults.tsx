import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollVote } from './PollResultItem';

import { usePollContext } from '../../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { usePollOptionVotesPagination } from '../../hooks/usePollOptionVotesPagination';

export type PollOptionFullResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  close: () => void;
  option: PollOption<StreamChatGenerics>;
};

const PollOptionFullResultsItem = ({ item }: { item: PollVoteClass }) => <PollVote {...item} />;

export const PollOptionFullResults = ({ close, option }: PollOptionFullResultsProps) => {
  const { hasNextPage, loadMore, votes } = usePollOptionVotesPagination({ option });
  const { vote_counts_by_option } = usePollContext();
  const PollOptionFullResultsHeader = useCallback(
    () => (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 16, marginLeft: 16 }}>
          {vote_counts_by_option[option.id] ?? 0} votes
        </Text>
      </View>
    ),
    [option, vote_counts_by_option],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 18 }}>
        <TouchableOpacity
          onPress={close}
          style={{
            alignItems: 'center',
            marginHorizontal: 16,
          }}
        >
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: 16, fontWeight: '500', marginHorizontal: 32 }}
        >
          {option.text}
        </Text>
      </View>
      <FlatList
        contentContainerStyle={{
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          marginBottom: 8,
          marginHorizontal: 16,
          marginTop: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        data={votes}
        keyExtractor={(item) => `option_full_results_${item.id}`}
        ListHeaderComponent={PollOptionFullResultsHeader}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={PollOptionFullResultsItem}
      />
    </View>
  );
};
