import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useChatContext, useTheme, useQueryReminders } from 'stream-chat-react-native';
import { ReminderResponse } from 'stream-chat';
import { ReminderItem } from './ReminderItem';

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

const renderItem = ({ item }: { item: ReminderResponse }) => <ReminderItem {...item} />;

export const RemindersList = () => {
  const [selectedTab, setSelectedTab] = useState<TabItemType>(tabs[0]);
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
    },
  } = useTheme();
  const { client } = useChatContext();

  const { data, isLoading, loadNext } = useQueryReminders();

  useEffect(() => {
    client.reminders.paginator.filters = {};
    client.reminders.paginator.sort = { remind_at: 1 };
  }, [client.reminders.paginator]);

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

  const renderEmptyComponent = useCallback(
    () => (
      <Text style={styles.emptyContainer}>
        {selectedTab.key === 'all' ? 'No reminders available' : `No ${selectedTab.title} reminders`}
      </Text>
    ),
    [selectedTab],
  );

  const renderFooter = useCallback(() => {
    if (isLoading) {
      return (
        <ActivityIndicator size={'small'} color={accent_blue} style={{ marginVertical: 16 }} />
      );
    }
  }, [accent_blue, isLoading]);

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
        keyExtractor={(item) => item.message_id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={loadNext}
        ListFooterComponent={renderFooter}
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
