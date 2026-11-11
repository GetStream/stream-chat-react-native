import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { DrawerContentComponentProps } from 'expo-router/drawer';
import type { ChannelSort } from 'stream-chat';

import type { Channel as ChannelClass, ChannelFilters } from 'stream-chat';
import {
  ChannelList,
  ChannelPreviewProps,
  Plus,
  useChannelsContext,
  useStableCallback,
  WithComponents,
} from 'stream-chat-expo';

import { AgentConfig } from '../agent/config';
import { useAppContext } from '../contexts/AppContext';

// The router keeps each conversation in an `agent` channel the user is a member of.
const filters: ChannelFilters = {
  members: {
    $in: [AgentConfig.user.id],
  },
  type: 'agent',
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
  const { openConversation, startConversation } = useAppContext();

  const onSelect = useStableCallback((channel: ChannelClass) => {
    openConversation(channel);
    navigation.closeDrawer();
  });

  const onCreateNewChat = useStableCallback(() => {
    startConversation();
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
