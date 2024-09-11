import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { ThreadManagerState } from 'stream-chat';

import { useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';
import { Reload } from '../../icons';

const selector = (nextValue: ThreadManagerState) => [nextValue.unseenThreadIds] as const;

export const ThreadListUnreadBanner = () => {
  const { client } = useChatContext();
  const [unseenThreadIds] = useStateStore(client.threads.state, selector);
  if (!unseenThreadIds.length) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => client.threads.reload()}
      style={{
        backgroundColor: '#080707',
        borderRadius: 16,
        flexDirection: 'row',
        marginHorizontal: 8,
        marginVertical: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ alignSelf: 'flex-start', color: 'white', flex: 1, fontSize: 16 }}>
        {unseenThreadIds.length} unread threads
      </Text>
      <Reload pathFill={'white'} />
    </TouchableOpacity>
  );
};
