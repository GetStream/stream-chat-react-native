import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaginatedPinnedMessages } from '../hooks/usePaginatedPinnedMessages';
import { Message } from '../icons/Message';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { ScreenHeader } from '../components/ScreenHeader';

import type { RouteProp } from '@react-navigation/native';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  details: {
    flex: 1,
    paddingLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  flex: {
    flex: 1,
  },
  noFiles: {
    fontSize: 16,
    paddingBottom: 8,
  },
  noFilesDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionContentContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 14,
  },
  size: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    paddingBottom: 2,
  },
});

type ChannelPinnedMessagesScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelPinnedMessagesScreen'
>;

export type ChannelPinnedMessagesScreenProps = {
  route: ChannelPinnedMessagesScreenRouteProp;
};

export const ChannelPinnedMessagesScreen: React.FC<ChannelPinnedMessagesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { loading, loadMore, messages } = usePaginatedPinnedMessages(channel);
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flex,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScreenHeader titleText='Pinned Messages' />
      <MessageSearchList
        loading={loading}
        loadMore={loadMore}
        messages={messages}
      />
    </View>
  );
};
