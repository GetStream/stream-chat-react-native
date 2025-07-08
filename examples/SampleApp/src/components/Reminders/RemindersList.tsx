import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useChatContext, useStateStore, useTheme } from 'stream-chat-react-native';
import { Event, PaginatorState, ReminderResponse } from 'stream-chat';
import { ReminderItem } from './ReminderItem';

const selector = (nextValue: PaginatorState<ReminderResponse>) =>
  ({
    isLoading: nextValue.isLoading,
    reminders: nextValue.items,
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

// Utility to sort reminders by remind_at date in ascending order
const sortRemindersByDate = (reminders: ReminderResponse[]) => {
  return reminders.sort((a, b) => {
    if (!a.remind_at || !b.remind_at) {
      return 0; // If either remind_at is missing, keep original order
    }
    // Sort by remind_at date
    return new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime();
  });
};

const isReminderOverdue = (reminder?: ReminderResponse) => {
  return reminder?.remind_at && new Date(reminder.remind_at) < new Date();
};

const isReminderUpcoming = (reminder?: ReminderResponse) => {
  return reminder?.remind_at && new Date(reminder.remind_at) > new Date();
};

export const RemindersList = () => {
  const [selectedTab, setSelectedTab] = useState<TabItemType>(tabs[0]);
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
    },
  } = useTheme();
  const { client } = useChatContext();
  const { isLoading, reminders } = useStateStore(client.reminders.paginator.state, selector);
  const [data, setData] = useState<ReminderResponse[]>(reminders ?? []);

  useEffect(() => {
    client.reminders.paginator.sort = { remind_at: 1 };
    client.reminders.paginator.state.subscribeWithSelector(
      ({ items }) => [items],
      ([items]) => {
        setData(items ?? []);
      },
    );
  }, [client.reminders.paginator]);

  useEffect(() => {
    if (selectedTab.key === 'all') {
      return;
    }
    const handleReminderDeleted = (event: Event) => {
      if (!event.reminder?.message_id) {
        return;
      }
      setData((prevData) => {
        return prevData.filter((item) => item.message.id !== event.reminder?.message_id);
      });
    };

    const handleReminderCreated = (event: Event) => {
      setData((prevData) => {
        if (!event.reminder) {
          return prevData;
        }
        const updatedData = [...prevData, event.reminder];
        return sortRemindersByDate(updatedData);
      });
    };

    const handleReminderUpdated = (event: Event) => {
      const { reminder } = event;
      setData((prevData) => {
        if (!reminder) {
          return prevData; // No update needed if reminder is undefined
        }
        const existingReminder = prevData.find((item) => item.message.id === reminder?.message_id);
        if (!existingReminder) {
          return prevData; // No update needed if reminder not found
        }

        if (existingReminder.remind_at && !event.reminder?.remind_at) {
          return prevData.filter((item) => item.message.id !== event.reminder?.message_id);
        }
        if (!existingReminder.remind_at && event.reminder?.remind_at) {
          return prevData.filter((item) => item.message.id !== event.reminder?.message_id);
        }
        if (isReminderOverdue(existingReminder) && !isReminderOverdue(event.reminder)) {
          return prevData.filter((item) => item.message.id !== event.reminder?.message_id);
        }
        if (isReminderUpcoming(existingReminder) && !isReminderUpcoming(event.reminder)) {
          return prevData.filter((item) => item.message.id !== event.reminder?.message_id);
        }

        return prevData;
      });
    };

    const listeners = [
      client.on('reminder.created', handleReminderCreated),
      client.on('reminder.deleted', handleReminderDeleted),
      client.on('reminder.updated', handleReminderUpdated),
    ];

    return () => {
      listeners.forEach((l) => l.unsubscribe());
    };
  }, [client, selectedTab]);

  const onEndReached = useCallback(() => {
    client.reminders.queryNextReminders();
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
    },
    [client.reminders],
  );

  const onRefresh = useCallback(async () => {
    await client.reminders.queryNextReminders();
  }, [client.reminders]);

  const renderItem = useCallback(
    ({ item }: { item: ReminderResponse }) => <ReminderItem {...item} />,
    [],
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
        style={{ flexGrow: 1 }}
        data={data}
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
