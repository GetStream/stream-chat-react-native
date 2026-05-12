import { useContext } from 'react';

import {
  ChannelContext,
  type ChannelContextValue,
} from '../../../contexts/channelContext/ChannelContext';
import {
  ChannelsContext,
  type ChannelsContextValue,
} from '../../../contexts/channelsContext/ChannelsContext';
import {
  ThreadContext,
  type ThreadContextValue,
} from '../../../contexts/threadContext/ThreadContext';
import {
  ThreadsContext,
  type ThreadsContextValue,
} from '../../../contexts/threadsContext/ThreadsContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../../../contexts/utils/defaultBaseContextValue';
import type { NotificationTargetPanel } from '../notificationTarget';

const isProvided = <T>(value: T) => value !== (DEFAULT_BASE_CONTEXT_VALUE as T);

export const useNotificationTarget = (): NotificationTargetPanel | undefined => {
  const channelContext = useContext(ChannelContext) as ChannelContextValue;
  const channelsContext = useContext(ChannelsContext) as ChannelsContextValue;
  const threadContext = useContext(ThreadContext) as ThreadContextValue;
  const threadsContext = useContext(ThreadsContext) as ThreadsContextValue;

  if (isProvided(channelContext) && channelContext.threadList) return 'thread';
  if (isProvided(threadContext) && threadContext.threadInstance) return 'thread';
  if (isProvided(channelContext) && channelContext.channel) return 'channel';
  if (isProvided(threadsContext)) return 'thread-list';
  if (isProvided(channelsContext)) return 'channel-list';

  return undefined;
};
