import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ChannelsUnreadCountBadge, ThreadsUnreadCountBadge } from './UnreadCountBadge';

import { ChatsTab } from '../icons/ChatsTab';
import { ThreadsTab } from '../icons/ThreadsTab';
import { MentionsTab } from '../icons/MentionsTab';

const styles = StyleSheet.create({
  notification: {
    left: 25, // size of icon
    position: 'absolute',
  },
  tabContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabListContainer: {
    borderTopColor: 'rgba(0, 0, 0, 0.0677)',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  tabTitle: {
    fontSize: 12,
    marginTop: 7,
    textAlign: 'center',
  },
});

const getTab = (key: string) => {
  switch (key) {
    case 'ChatScreen':
      return {
        icon: <ChatsTab />,
        iconActive: <ChatsTab active />,
        notification: <ChannelsUnreadCountBadge />,
        title: 'Chats',
      };
    case 'ThreadsScreen':
      return {
        icon: <ThreadsTab />,
        iconActive: <ThreadsTab active />,
        notification: <ThreadsUnreadCountBadge />,
        title: 'Threads',
      };
    case 'MentionsScreen':
      return {
        icon: <MentionsTab />,
        iconActive: <MentionsTab active />,
        title: 'Mentions',
      };
    default:
      return null;
  }
};

const Tab = (props) => {
  const { navigation, state, route, index } = props;
  const tab = getTab(route.name);

  const isFocused = state.index === index;

  if (!tab) {
    return null;
  }

  const onPress = () => {
    navigation.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    });
    if (!isFocused) {
      navigation.navigate(route.name);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabContainer}>
      <View>
        {isFocused ? tab.iconActive : tab.icon}
        {tab.notification && <View style={styles.notification}>{tab.notification}</View>}
      </View>
      <Text
        style={[
          styles.tabTitle,
        ]}
      >
        {tab.title}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomTabs: React.FC = (props) => {
  const { navigation, state } = props;

  return (
    <View
      style={[
        styles.tabListContainer,
        {
          paddingBottom: 0,
        },
      ]}
    >
      {state.routes.map((route, index) => (
        <Tab key={index} route={route} index={index} navigation={navigation} state={state} />
      ))}
    </View>
  );
};
