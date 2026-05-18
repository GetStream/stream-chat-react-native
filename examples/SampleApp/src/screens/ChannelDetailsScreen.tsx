import React, { useCallback } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChannelDetailsScreen as StreamChannelDetailsScreen } from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

type ChannelDetailsScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelDetailsScreen'>;

type ChannelDetailsScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ChannelDetailsScreen'
>;

type Props = {
  navigation: ChannelDetailsScreenNavigationProp;
  route: ChannelDetailsScreenRouteProp;
};

export const ChannelDetailsScreen: React.FC<Props> = ({
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
  const onViewAllMembersPress = useCallback(() => {
    navigation.navigate('ChannelAllMembersScreen', { channel });
  }, [navigation, channel]);

  const onAddMembersPress = useCallback(() => {
    navigation.navigate('ChannelAddMembersScreen', { channel });
  }, [navigation, channel]);

  return (
    <>
      {(channel.data?.member_count ?? 0) % 2 === 0 ? (
        <StreamChannelDetailsScreen
          channel={channel}
          onBack={onBack}
          onChannelDismiss={popToRoot}
        />
      ) : (
        <StreamChannelDetailsScreen
          channel={channel}
          onBack={onBack}
          onChannelDismiss={popToRoot}
          onViewAllMembersPress={onViewAllMembersPress}
          onAddMembersPress={onAddMembersPress}
        />
      )}
    </>
  );
};
