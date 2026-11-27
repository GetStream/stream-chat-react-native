import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  LayoutAnimationConfig,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Route } from '@react-navigation/native';
import { useTheme } from 'stream-chat-react-native';

import { ChannelsUnreadCountBadge, ThreadsUnreadCountBadge } from './UnreadCountBadge';

import { ChatsTab } from '../icons/ChatsTab';
import { DraftsTab } from '../icons/DraftsTab';
import { MentionsTab } from '../icons/MentionsTab';

import { RemindersTab } from '../icons/ReminderTab';
import { ScheduledTab } from '../icons/ScheduledTab';
import { ThreadsTab } from '../icons/ThreadsTab';
import { useLegacyColors } from '../theme/useLegacyColors';

const TAB_BAR_SLIDE_DURATION_MS = 200;

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
    case 'DraftsScreen':
      return {
        icon: <DraftsTab />,
        iconActive: <DraftsTab active />,
        title: 'Drafts',
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
    case 'RemindersScreen':
      return {
        icon: <RemindersTab />,
        iconActive: <RemindersTab active />,
        title: 'Reminders',
      };
    case 'ScheduledScreen':
      return {
        icon: <ScheduledTab />,
        iconActive: <ScheduledTab active />,
        title: 'Scheduled',
      };
    // Add more cases for other tabs as needed
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
  useTheme();
  const { black, grey } = useLegacyColors();
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
  const { descriptors, navigation, state } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const { bottom, left, right } = useSafeAreaInsets();
  const { tabBarStyle } = descriptors[state.routes[state.index].key].options;

  // A screen hides the tab bar with `tabBarStyle: { display: 'none' }`, e.g. while editing. It
  // slides down out of view, and back up when shown again, but not when the app opens.
  const hidden = StyleSheet.flatten(tabBarStyle)?.display === 'none';

  return (
    <LayoutAnimationConfig skipEntering>
      {hidden ? null : (
        <Animated.View
          entering={SlideInDown.duration(TAB_BAR_SLIDE_DURATION_MS)}
          exiting={SlideOutDown.duration(TAB_BAR_SLIDE_DURATION_MS)}
          style={[
            styles.tabListContainer,
            {
              backgroundColor: semantics.backgroundCoreElevation1,
              borderTopColor: semantics.borderCoreSubtle,
              paddingBottom: bottom,
              paddingLeft: left,
              paddingRight: right,
            },
          ]}
        >
          {state.routes.map((route, index) => (
            <Tab key={index} route={route} index={index} navigation={navigation} state={state} />
          ))}
        </Animated.View>
      )}
    </LayoutAnimationConfig>
  );
};
