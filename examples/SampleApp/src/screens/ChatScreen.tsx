import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { RouteProp } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChannelListScreen } from './ChannelListScreen';
import { DraftsScreen } from './DraftScreen';
import { MentionsScreen } from './MentionsScreen';
import { RemindersScreen } from './RemindersScreen';
import { ThreadListScreen } from './ThreadListScreen';

import { BottomTabs } from '../components/BottomTabs';

import type { BottomTabNavigatorParamList, StackNavigatorParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();

type ChatScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'MessagingScreen'
>;
type ChatScreenRouteProp = RouteProp<StackNavigatorParamList, 'MessagingScreen'>;

type Props = {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
};

export const ChatScreen: React.FC<Props> = () => (
  // eslint-disable-next-line react/no-unstable-nested-components
  <Tab.Navigator tabBar={(props) => <BottomTabs {...props} />}>
    <Tab.Screen component={ChannelListScreen} name='ChatScreen' options={{ headerShown: false }} />
    <Tab.Screen component={MentionsScreen} name='MentionsScreen' options={{ headerShown: false }} />
    <Tab.Screen
      component={ThreadListScreen}
      name='ThreadsScreen'
      options={{ headerShown: false }}
    />
    <Tab.Screen component={DraftsScreen} name='DraftsScreen' options={{ headerShown: false }} />
    <Tab.Screen
      component={RemindersScreen}
      name='RemindersScreen'
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);
