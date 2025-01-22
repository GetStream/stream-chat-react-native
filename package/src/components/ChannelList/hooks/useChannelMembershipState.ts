import { useEffect, useState } from 'react';

import { Channel, ChannelState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelMembershipState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel?: Channel<StreamChatGenerics>,
) => {
  const [membership, setMembership] = useState<ChannelState<StreamChatGenerics>['membership']>(
    () => channel?.state.membership || {},
  );

  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(
    () => {
      if (!channel) return;

      setMembership(channel.state.membership);

      const handleMembershipUpdate = () => {
        setMembership(channel.state.membership);
      };

      const subscriptions = ['member.updated'].map((event) =>
        client.on(event, handleMembershipUpdate),
      );

      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channel?.state.membership, client],
  );

  return membership;
};
