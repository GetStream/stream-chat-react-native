import { useMemo } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelActionItem,
  useChannelActionItems,
} from '../../../hooks/actions/useChannelActionItems';

/**
 * @experimental This hook is experimental and is subject to change.
 */
export const useChannelDetailsActionItems = (): ChannelActionItem[] => {
  const { channel, getChannelActionItems, onChannelDismiss } = useChannelDetailsContext();

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
