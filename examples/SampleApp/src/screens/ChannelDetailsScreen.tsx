import React, { useCallback } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ChannelDetailsScreen as StreamChannelDetailsScreen,
  GetChannelMemberActionItems,
} from 'stream-chat-react-native';

import { SendDirectMessage } from '../icons/SendDirectMessage';

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

  const getChannelMemberActionItems = useCallback<GetChannelMemberActionItems>(
    ({ context, defaultItems }) => {
      const user = context.member.user;
      // Don't offer sending a direct message to yourself.
      if (!user || user.id === context.channel.getClient().userID) {
        return defaultItems;
      }
      return [
        {
          action: () => {
            navigation.navigate('NewDirectMessagingScreen', { initialUser: user });
            return Promise.resolve();
          },
          Icon: SendDirectMessage,
          id: 'sendDirectMessage',
          label: context.t('Send Direct Message'),
          type: 'standard',
        },
        ...defaultItems,
      ];
    },
    [navigation],
  );

  return (
    <StreamChannelDetailsScreen
      channel={channel}
      getChannelMemberActionItems={getChannelMemberActionItems}
      onBack={onBack}
      onChannelDismiss={popToRoot}
    />
  );
};
