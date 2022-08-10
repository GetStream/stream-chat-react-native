import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'stream-chat-react-native';

import {UnreadCountBadge} from './UnreadCountBadge';

import {ChatsTab} from '../icons/ChatsTab';
import {MentionsTab} from '../icons/MentionsTab';

import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

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

export const BottomTabs: React.FC<BottomTabBarProps> = props => {
  const {navigation, state} = props;
  const {
    theme: {
      colors: {black, grey, white},
    },
  } = useTheme();
  const {bottom} = useSafeAreaInsets();

  const getTab = (key: string) => {
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
        styles.tabListContainer,
        {
          backgroundColor: white,
          paddingBottom: bottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        const tab = getTab(route.name);

        if (!tab) {
          return null;
        }

        const isFocused = state.index === index;

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
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabContainer}>
            <View>
              {isFocused ? tab.iconActive : tab.icon}
              {tab.notification && (
                <View style={styles.notification}>{tab.notification}</View>
              )}
            </View>
            <Text
              style={[
                styles.tabTitle,
                {
                  color: isFocused ? black : grey,
                },
              ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
