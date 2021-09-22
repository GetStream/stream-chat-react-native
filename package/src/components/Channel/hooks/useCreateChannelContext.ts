import { useMemo } from 'react';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreateChannelContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  channel,
  disabled,
  EmptyStateIndicator,
  enforceUniqueReaction,
  error,
  giphyEnabled,
  hideDateSeparators,
  isAdmin,
  isChannelActive,
  isModerator,
  isOwner,
  lastRead,
  loadChannelAtMessage,
  loading,
  LoadingIndicator,
  markRead,
  maxTimeBetweenGroupedMessages,
  members,
  NetworkDownIndicator,
  read,
  readEventsEnabled,
  reloadChannel,
  scrollToFirstUnreadThreshold,
  setLastRead,
  setTargetedMessage,
  StickyHeader,
  targetedMessage,
  threadList,
  typingEventsEnabled,
  watcherCount,
  watchers,
}: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const channelId = channel?.id;
  const lastReadTime = lastRead?.getTime();
  const membersLength = Object.keys(members).length;

  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers.map(({ last_read }) => last_read.toISOString()).join();

  const channelContext: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      channel,
      disabled,
      EmptyStateIndicator,
      enforceUniqueReaction,
      error,
      giphyEnabled,
      hideDateSeparators,
      isAdmin,
      isChannelActive,
      isModerator,
      isOwner,
      lastRead,
      loadChannelAtMessage,
      loading,
      LoadingIndicator,
      markRead,
      maxTimeBetweenGroupedMessages,
      members,
      NetworkDownIndicator,
      read,
      readEventsEnabled,
      reloadChannel,
      scrollToFirstUnreadThreshold,
      setLastRead,
      setTargetedMessage,
      StickyHeader,
      targetedMessage,
      threadList,
      typingEventsEnabled,
      watcherCount,
      watchers,
    }),
    [
      channelId,
      disabled,
      error,
      isChannelActive,
      lastReadTime,
      loading,
      membersLength,
      readEventsEnabled,
      readUsersLength,
      readUsersLastReads,
      targetedMessage,
      threadList,
      typingEventsEnabled,
      watcherCount,
    ],
  );

  return channelContext;
};
