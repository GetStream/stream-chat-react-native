import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native/v2';

import { ChatsTab } from '../icons/ChatsTab';
import { MentionsTab } from '../icons/MentionsTab';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { UnreadCountBadge } from './UnreadCountBadge';

export const BottomTabs: React.FC<BottomTabBarProps> = ({
  navigation,
  state,
}) => {
  const {
    theme: {
      colors: { black, grey, white },
    },
  } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const getTitle = (key: string) => {
    switch (key) {
      case 'ChatScreen':
        return {
          icon: <ChatsTab />,
          iconActive: <ChatsTab active />,
          notification: <UnreadCountBadge />,
          title: 'Chats',
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
  return (
    <View
      style={[
        {
          backgroundColor: white,
          paddingBottom: bottom,
        },
        styles.tabListContainer,
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = getTitle(route.name);

        if (!tab) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabContainer}
          >
            <View>
              {isFocused ? tab.iconActive : tab.icon}
              {tab.notification && (
                <View
                  style={{
                    left: 25, // size of icon
                    position: 'absolute',
                  }}
                >
                  {tab.notification}
                </View>
              )}
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 10,
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
