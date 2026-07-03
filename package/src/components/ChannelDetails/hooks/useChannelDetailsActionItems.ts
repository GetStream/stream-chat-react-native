import { useMemo } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelActionItem,
  GetChannelActionItems,
  useChannelActionItems,
} from '../../../hooks/actions/useChannelActionItems';

export const useChannelDetailsActionItems = ({
  getChannelActionItems,
  onChannelDismiss,
}: {
  getChannelActionItems?: GetChannelActionItems;
  onChannelDismiss?: () => void;
} = {}): ChannelActionItem[] => {
  const { channel } = useChannelDetailsContext();

  const items = useChannelActionItems({ channel, getChannelActionItems, surface: 'details' });

  return useMemo(
    () =>
      items.map((item) => {
        if (item.id === 'leave' || item.id === 'deleteChannel' || item.id === 'block') {
          return {
            ...item,
            action: (options) =>
              item.action({
                ...options,
                onSuccess: () => {
                  options?.onSuccess?.();
                  onChannelDismiss?.();
                },
              }),
          };
        }
        return item;
      }),
    [items, onChannelDismiss],
  );
};
