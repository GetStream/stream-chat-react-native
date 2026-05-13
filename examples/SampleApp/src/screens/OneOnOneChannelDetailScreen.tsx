import React, { useCallback } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChannelDetailsScreen } from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

type OneOnOneChannelDetailScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type OneOnOneChannelDetailScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type Props = {
  navigation: OneOnOneChannelDetailScreenNavigationProp;
  route: OneOnOneChannelDetailScreenRouteProp;
};

export const OneOnOneChannelDetailScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const onBack = useCallback(() => navigation.goBack(), [navigation]);
  const popToRoot = useCallback(
    () =>
      navigation.reset({
        index: 0,
        routes: [{ name: 'MessagingScreen' }],
      }),
    [navigation],
  );

  return <ChannelDetailsScreen channel={channel} onBack={onBack} onChannelDismiss={popToRoot} />;
};
