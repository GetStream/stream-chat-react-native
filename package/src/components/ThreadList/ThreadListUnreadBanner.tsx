import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { ThreadManagerState } from 'stream-chat';

import { useChatContext, useTheme } from '../../contexts';
import { useStateStore } from '../../hooks';
import { Reload } from '../../icons';

const styles = StyleSheet.create({
  text: { alignSelf: 'flex-start', flex: 1, fontSize: 16 },
  touchableWrapper: {
    borderRadius: 16,
    flexDirection: 'row',
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});

const selector = (nextValue: ThreadManagerState) =>
  ({ unseenThreadIds: nextValue.unseenThreadIds }) as const;

export const ThreadListUnreadBanner = () => {
  const { client } = useChatContext();
  const {
    theme: {
      colors: { text_high_emphasis, white },
      threadListUnreadBanner,
    },
  } = useTheme();
  const { unseenThreadIds } = useStateStore(client.threads.state, selector);
  if (!unseenThreadIds.length) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => client.threads.reload()}
      style={[
        styles.touchableWrapper,
        { backgroundColor: text_high_emphasis },
        threadListUnreadBanner.touchableWrapper,
      ]}
    >
      <Text style={[styles.text, { color: white }, threadListUnreadBanner.text]}>
        {unseenThreadIds.length} unread threads
      </Text>
      <Reload pathFill={white} />
    </TouchableOpacity>
  );
};
