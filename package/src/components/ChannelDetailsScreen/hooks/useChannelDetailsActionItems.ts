import { useCallback } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelActionItem,
  GetChannelActionItems,
  useChannelActionItems,
} from '../../../hooks/useChannelActionItems';

export const useChannelDetailsActionItems = (): ChannelActionItem[] => {
  const { channel, onAfterDeleteChat, onAfterLeaveGroup } = useChannelDetailsContext();

  const getActionItemsForDetailsScreen = useCallback<GetChannelActionItems>(
    ({ defaultItems }) =>
      defaultItems.map((item) => {
        if (item.id === 'leave') {
          return {
            ...item,
            action: async () => {
              await item.action();
              onAfterLeaveGroup?.(channel);
            },
          };
        }
        if (item.id === 'deleteChannel') {
          return {
            ...item,
            action: async () => {
              await item.action();
              onAfterDeleteChat?.(channel);
            },
          };
        }
        return item;
      }),
    [channel, onAfterDeleteChat, onAfterLeaveGroup],
  );

  return useChannelActionItems({
    channel,
    getChannelActionItems: getActionItemsForDetailsScreen,
  });
};
