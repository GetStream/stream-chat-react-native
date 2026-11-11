import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schemas } from '@stream-io/calypso';
import type { DrawerContentComponentProps } from 'expo-router/drawer';

import { Plus, useStableCallback } from 'stream-chat-expo';

import { agentSessions } from '../agent/agents';
import { useAppContext } from '../contexts/AppContext';

type SessionRow = Schemas['Session'];

const keyExtractor = (session: SessionRow) => session.id;

/** The agent's conversations, newest first, as the router lists them. */
export const MenuDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const { conversationsVersion, openConversation, sessionId, startConversation } = useAppContext();
  const [sessions, setSessions] = useState<readonly SessionRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    agentSessions()
      .query({ limit: 30 })
      .then((page) => {
        if (!cancelled) setSessions(page.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationsVersion]);

  const onSelect = useStableCallback((id: string) => {
    openConversation(id);
    navigation.closeDrawer();
  });

  const onCreateNewChat = useStableCallback(() => {
    startConversation();
    navigation.closeDrawer();
  });

  const renderItem = ({ item }: { item: SessionRow }) => (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text numberOfLines={1} style={[styles.previewText, item.id === sessionId && styles.current]}>
        {item.title || 'New conversation'}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Conversations</Text>
        <Pressable accessibilityLabel='New conversation' onPress={onCreateNewChat}>
          <Plus size={24} stroke='#000000' />
        </Pressable>
      </View>
      <FlatList data={sessions} keyExtractor={keyExtractor} renderItem={renderItem} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    paddingVertical: 16,
  },
  current: { color: '#005FFF' },
  previewText: { fontSize: 15, fontWeight: 'bold' },
  row: { paddingHorizontal: 12, paddingVertical: 8 },
  title: { fontSize: 15, fontWeight: 'bold' },
  wrapper: { backgroundColor: '#FFFFFF', flex: 1 },
});
