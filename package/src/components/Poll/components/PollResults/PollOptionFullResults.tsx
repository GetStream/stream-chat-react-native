import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { PollOption } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { Avatar } from '../../../Avatar/Avatar';
import { usePollOptionVotesPagination } from '../../hooks/usePollOptionVotesPagination';

export type PollOptionFullResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  close: () => void;
  option: PollOption<StreamChatGenerics>;
};

export const PollOptionFullResults = ({ close, option }: PollOptionFullResultsProps) => {
  // console.log('ISE: OPTION: ', option.id);
  const { hasNextPage, loadMore, votes } = usePollOptionVotesPagination({ option });
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={close}
          style={{
            alignItems: 'center',
            marginHorizontal: 16,
          }}
        >
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>{option.text}</Text>
      </View>
      <FlatList
        data={votes}
        // keyExtractor={(item) => item.id}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={({ item }) => (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row' }}>
                <Avatar
                  // containerStyle={{ position: 'absolute', right: index * 15 }}
                  image={item.user?.image as string}
                  size={20}
                />
              </View>
              <Text>{item.created_at}</Text>
            </View>
          </>
        )}
      />
    </View>
  );
};
