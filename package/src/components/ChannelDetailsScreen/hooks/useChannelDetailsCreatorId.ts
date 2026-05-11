import { useMemo } from 'react';

import type { Channel, UserResponse } from 'stream-chat';

export const useChannelDetailsCreatorId = (channel: Channel): string | undefined =>
  useMemo(() => {
    const data = channel.data;
    if (!data) return undefined;
    return data.created_by_id ?? (data.created_by as UserResponse | undefined)?.id;
  }, [channel.data]);
