import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ChannelListScreen } from './ChannelListScreen';
import { MentionsScreen } from './MentionsScreen';

import { BottomTabs } from '../components/BottomTabs';

import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import type {
  BottomTabNavigatorParamList,
  StackNavigatorParamList,
} from '../types';

const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();

type ChatScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChatScreen'
>;
type ChatScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChatScreen'>;

type Props = {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
};

export const ChatScreen: React.FC<Props> = () => (
  <Tab.Navigator tabBar={(props) => <BottomTabs {...props} />}>
    <Tab.Screen component={ChannelListScreen} name='ChatScreen' />
    <Tab.Screen component={MentionsScreen} name='MentionsScreen' />
  </Tab.Navigator>
);
