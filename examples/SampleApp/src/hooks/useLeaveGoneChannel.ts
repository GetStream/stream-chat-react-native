import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Channel, ChannelLifecycleState } from 'stream-chat';
import { useStateStore } from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

const selector = (state: ChannelLifecycleState) => ({ pendingDisposal: state.pendingDisposal });

/**
 * Returns to the channel list once the channel is gone: deleted, or the user removed from it.
 * `<Channel>` keeps rendering a gone channel, so what to show instead is up to the app.
 */
export const useLeaveGoneChannel = (channel: Channel | undefined) => {
  const navigation = useNavigation<NativeStackNavigationProp<StackNavigatorParamList>>();
  const { pendingDisposal } = useStateStore(channel?.state, selector) ?? {};

  useEffect(() => {
    if (pendingDisposal) {
      navigation.popTo('MessagingScreen');
    }
  }, [navigation, pendingDisposal]);
};
