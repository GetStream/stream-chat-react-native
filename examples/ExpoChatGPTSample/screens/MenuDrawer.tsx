import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { DrawerContentComponentProps } from 'expo-router/drawer';
import type { ChannelSort } from 'stream-chat';

import type { Channel as ChannelClass } from 'stream-chat';
import {
  ChannelList,
  ChannelPreviewProps,
  Plus,
  useChannelsContext,
  useChatContext,
  useStableCallback,
  WithComponents,
} from 'stream-chat-expo';

import { chatUserId } from '../chatConfig';

import { createChannel, useAppContext } from '../contexts/AppContext';

const filters = {
  members: {
    $in: [chatUserId],
  },
};

const sort: ChannelSort = { last_updated: -1 };

const ChannelPreview = (props: ChannelPreviewProps) => {
  const channel = props.channel;
  const { onSelect } = useChannelsContext();
  const onPress = useStableCallback(() => {
    onSelect?.(channel);
  });
  return (
    <Pressable
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        opacity: pressed ? 0.6 : 1,
      })}
      onPress={onPress}
    >
      <Text style={styles.previewText} numberOfLines={1}>
        {channel.data?.name ?? channel.cid}
      </Text>
    </Pressable>
  );
};

export const MenuDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const { client } = useChatContext();
  const { setChannel } = useAppContext();

  const onSelect = useStableCallback((channel: ChannelClass) => {
    setChannel(channel);
    navigation.closeDrawer();
  });

  const onCreateNewChat = useStableCallback(() => {
    setChannel(createChannel(client));
    navigation.closeDrawer();
  });

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Conversations</Text>
        <Pressable onPress={onCreateNewChat}>
          <Plus size={24} stroke='#000000' />
        </Pressable>
      </View>
      <WithComponents overrides={{ ChannelPreview }}>
        <ChannelList filters={filters} sort={sort} onSelect={onSelect} />
      </WithComponents>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'grey',
  },
  title: { fontSize: 15, fontWeight: 'bold' },
  previewText: { fontSize: 15, fontWeight: 'bold' },
});
