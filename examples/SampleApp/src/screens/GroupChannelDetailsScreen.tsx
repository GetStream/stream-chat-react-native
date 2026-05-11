import React, { useCallback } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChannelDetailsScreen } from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

type GroupChannelDetailsRouteProp = RouteProp<StackNavigatorParamList, 'GroupChannelDetailsScreen'>;

type GroupChannelDetailsScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

type GroupChannelDetailsProps = {
  navigation: GroupChannelDetailsScreenNavigationProp;
  route: GroupChannelDetailsRouteProp;
};

export const GroupChannelDetailsScreen: React.FC<GroupChannelDetailsProps> = ({
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

  return (
    <ChannelDetailsScreen
      channel={channel}
      onAfterDeleteChat={popToRoot}
      onAfterLeaveGroup={popToRoot}
      onBack={onBack}
    />
  );
};
