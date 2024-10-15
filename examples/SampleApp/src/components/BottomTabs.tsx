import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native';

import { ChannelsUnreadCountBadge, ThreadsUnreadCountBadge } from './UnreadCountBadge';

import { ChatsTab } from '../icons/ChatsTab';
import { ThreadsTab } from '../icons/ThreadsTab';
import { MentionsTab } from '../icons/MentionsTab';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Route } from '@react-navigation/native';

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

type TabProps = Pick<BottomTabBarProps, 'navigation' | 'state'> & {
  index: number;
  route: Route<string>;
};

const Tab = (props: TabProps) => {
  const { navigation, state, route, index } = props;
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();
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
          {
            color: isFocused ? black : grey,
          },
        ]}
      >
        {tab.title}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomTabs: React.FC<BottomTabBarProps> = (props) => {
  const { navigation, state } = props;
  const {
    theme: {
      colors: { white },
    },
  } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabListContainer,
        {
          backgroundColor: white,
          paddingBottom: bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => (
        <Tab key={index} route={route} index={index} navigation={navigation} state={state} />
      ))}
    </View>
  );
};
