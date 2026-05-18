import { useCallback } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelActionItem,
  GetChannelActionItems,
  useChannelActionItems,
} from '../../../hooks/useChannelActionItems';

export const useChannelDetailsActionItems = (): ChannelActionItem[] => {
  const { channel, onChannelDismiss } = useChannelDetailsContext();

  const getActionItemsForDetailsScreen = useCallback<GetChannelActionItems>(
    ({ defaultItems }) =>
      defaultItems.map((item) => {
        if (item.id === 'leave' || item.id === 'deleteChannel') {
          return {
            ...item,
            action: (options) => item.action({ ...options, onSuccess: onChannelDismiss }),
          };
        }
        return item;
      }),
    [onChannelDismiss],
  );

  return useChannelActionItems({
    channel,
    getChannelActionItems: getActionItemsForDetailsScreen,
  });
};
