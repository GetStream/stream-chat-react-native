import { LogoutButton } from '@/components/LogoutButton';
import { useStreamChatTheme } from '@/hooks/useStreamChatTheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const theme = useStreamChatTheme();
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <LogoutButton />,
        headerStyle: { backgroundColor: theme.colors?.white_snow },
        headerTintColor: theme.colors?.black,
        tabBarStyle: {
          backgroundColor: theme.colors?.white_snow,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='chatbox-outline' color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name='threads'
        options={{
          title: 'Threads',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='logo-threads' color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
