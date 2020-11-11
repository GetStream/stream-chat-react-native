/* eslint-disable sort-keys */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@react-navigation/native';
import { ChatsTab } from '../icons/ChatsTab';
import { MentionsTab } from '../icons/MentionsTab';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppTheme } from '../types';

export const BottomTabs: React.FC<BottomTabBarProps> = ({
  navigation,
  state,
}) => {
  const { colors } = useTheme() as AppTheme;
  const insets = useSafeAreaInsets();

  const getTitle = (key: string) => {
    switch (key) {
      case 'chats':
        return {
          icon: <ChatsTab height={25} width={25} />,
          iconActive: <ChatsTab active height={25} width={25} />,
          title: 'Home',
        };
      case 'mentions':
        return {
          icon: <MentionsTab height={25} width={25} />,
          iconActive: <MentionsTab active height={25} width={25} />,
          title: 'Mentions',
        };
      default:
        return {
          icon: <ChatsTab height={25} width={25} />,
          iconActive: <ChatsTab active height={25} width={25} />,
          title: 'Home',
        };
    }
  };
  return (
    <View
      style={[
        {
          paddingBottom: insets.bottom,
          backgroundColor: colors.backgroundNavigation,
        },
        styles.tabListContainer,
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = getTitle(route.name);

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
            {isFocused ? tab.iconActive : tab.icon}
            <Text
              style={[
                styles.tabTitle,
                {
                  opacity: isFocused ? 1 : 0.5,
                  color: colors.text,
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
  tabListContainer: {
    flexDirection: 'row',
    borderTopColor: 'rgba(0, 0, 0, 0.0677)',
    borderTopWidth: 1,
  },
  tabContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 10,
  },
  tabTitle: {
    fontSize: 12,
  },
});
