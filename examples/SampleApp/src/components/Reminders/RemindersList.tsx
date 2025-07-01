import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useChatContext, useStateStore, useTheme } from 'stream-chat-react-native';
import { PaginatorState, ReminderResponse } from 'stream-chat';
import { ReminderItem } from './ReminderItem';
import { useIsFocused } from '@react-navigation/native';

const selector = (nextValue: PaginatorState<ReminderResponse>) =>
  ({
    isLoading: nextValue.isLoading,
    items: nextValue.items,
  }) as const;

const tabs = [
  { key: 'all', title: 'All' },
  { key: 'overdue', title: 'Overdue' },
  { key: 'upcoming', title: 'Upcoming' },
  { key: 'scheduled', title: 'Scheduled' },
  { key: 'saved-for-later', title: 'Saved for Later' },
];

type TabItemType = {
  key: string;
  title: string;
};

export const RemindersList = () => {
  const [selectedTab, setSelectedTab] = useState<TabItemType>(tabs[0]);
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
    },
  } = useTheme();
  const isFocused = useIsFocused();
  const { client } = useChatContext();
  const { isLoading, items } = useStateStore(client.reminders.paginator.state, selector);
  const [reminders, setReminders] = useState<ReminderResponse[] | undefined>([]);

  useEffect(() => {
    setReminders(items);
  }, [items]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    client.reminders.paginator.sort = { remind_at: 1 };
  }, [client.reminders.paginator, isFocused]);

  const onEndReached = useCallback(() => {
    client.reminders.paginator.next();
  }, [client.reminders]);

  const onChangeTab = useCallback(
    async (tab: TabItemType) => {
      setSelectedTab(tab);
      if (tab.key === 'all') {
        client.reminders.paginator.filters = {};
      } else if (tab.key === 'overdue') {
        client.reminders.paginator.filters = {
          remind_at: { $lte: new Date().toISOString() },
        };
      } else if (tab.key === 'upcoming') {
        client.reminders.paginator.filters = {
          remind_at: { $gt: new Date().toISOString() },
        };
      } else if (tab.key === 'scheduled') {
        client.reminders.paginator.filters = {
          remind_at: { $exists: true },
        };
      } else if (tab.key === 'saved-for-later') {
        client.reminders.paginator.filters = {
          remind_at: { $eq: null },
        };
      }
      await client.reminders.queryNextReminders();
    },
    [client.reminders],
  );

  const onRefresh = useCallback(async () => {
    await client.reminders.queryNextReminders();
  }, [client.reminders]);

  const onDeleteItemHandler = useCallback((id: string) => {
    setReminders((prevReminders) =>
      prevReminders?.filter((reminder) => reminder.message_id !== id),
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ReminderResponse }) => (
      <ReminderItem {...item} onDeleteHandler={onDeleteItemHandler} />
    ),
    [onDeleteItemHandler],
  );

  const renderEmptyComponent = useCallback(
    () => (
      <Text style={styles.emptyContainer}>
        {selectedTab.key === 'all' ? 'No reminders available' : `No ${selectedTab.title} reminders`}
      </Text>
    ),
    [selectedTab],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.container}
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => onChangeTab(tab)}
              style={[
                styles.tab,
                { backgroundColor: selectedTab === tab ? accent_blue : grey_gainsboro },
              ]}
            >
              <Text style={styles.tabText}>{tab.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={reminders}
        refreshing={isLoading}
        onRefresh={onRefresh}
        keyExtractor={(item) => item.message.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={onEndReached}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tabBar: {
    marginVertical: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabText: {
    fontWeight: '500',
    fontSize: 14,
    color: 'white',
  },
  emptyContainer: {
    textAlign: 'center',
  },
});
