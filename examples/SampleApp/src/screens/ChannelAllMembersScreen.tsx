import React, { useMemo } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { StackNavigatorParamList } from '../types';
import { ChannelDetailsContext, ChannelMemberList } from 'stream-chat-react-native-core';

type ChannelAllMembersScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelAllMembersScreen'
>;

type ChannelAllMembersScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ChannelAllMembersScreen'
>;

type Props = {
  navigation: ChannelAllMembersScreenNavigationProp;
  route: ChannelAllMembersScreenRouteProp;
};

export const ChannelAllMembersScreen: React.FC<Props> = ({
  route: {
    params: { channel },
  },
}) => {
  const channelDetailsContextValue = useMemo(() => ({ channel }), [channel]);

  return (
    <ChannelDetailsContext.Provider value={channelDetailsContextValue}>
      <ChannelMemberList />
    </ChannelDetailsContext.Provider>
  );
};
