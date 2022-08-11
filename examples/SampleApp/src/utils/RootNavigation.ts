import React from 'react';
import { CommonActions, NavigationContainerRef } from '@react-navigation/native';
import { StackNavigatorParamList } from '../types';

export const RootNavigationRef = React.createRef<NavigationContainerRef>();

export const navigateToChannel = (channelId: string | null | undefined) => {
  if (!channelId || !RootNavigationRef.current) {
    return;
  }
  const navigation = RootNavigationRef.current;
  navigation.dispatch((state) => {
    const routes = state.routes.slice();
    if (routes?.length) {
      const lastStackRoute = routes[routes.length - 1];
      if (lastStackRoute.name === 'ChannelScreen') {
        const params = lastStackRoute.params as
          | StackNavigatorParamList['ChannelScreen']
          | undefined;
        if (params?.channelId === channelId || params?.channel?.id === channelId) {
          // dont do anything as the channel is already being shown
        } else {
          // replace existing channel screen with a new one
          routes.pop();
          routes.push({
            key: `${Date.now()}`,
            name: 'ChannelScreen',
            params: { channelId },
          });
        }
      } else {
        // navigate to channel screen
        return CommonActions.navigate({
          key: `${Date.now()}`,
          name: 'ChannelScreen',
          params: { channelId },
        });
      }
    }
    return CommonActions.reset({
      ...state,
      index: routes.length - 1,
      routes,
    });
  });
};
