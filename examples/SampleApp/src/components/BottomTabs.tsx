import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native/v2';

import { ChatsTab } from '../icons/ChatsTab';
import { MentionsTab } from '../icons/MentionsTab';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

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
          icon: <ChatsTab height={25} width={25} />,
          iconActive: <ChatsTab active height={25} width={25} />,
          title: 'Home',
        };
      case 'MentionsScreen':
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
          backgroundColor: white,
          paddingBottom: bottom,
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
                  color: isFocused ? black : grey,
                  opacity: isFocused ? 1 : 0.5,
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
  },
});
