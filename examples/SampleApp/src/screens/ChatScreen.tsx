import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChannelListScreen } from './ChannelListScreen';

import { BottomTabs } from '../components/BottomTabs';
import { MentionsScreen } from './MentionsScreen';

const Tab = createBottomTabNavigator();

export const ChatScreen = () => (
  <Tab.Navigator tabBar={(props) => <BottomTabs {...props} />}>
    <Tab.Screen component={ChannelListScreen} name='chats' />
    <Tab.Screen component={MentionsScreen} name='mentions' />
  </Tab.Navigator>
);
