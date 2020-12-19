import { Channel } from 'stream-chat';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';

export const useChannelMembersStatus = (
  channel?: Channel<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >,
) => {
  if (!channel) return '';

  const watchersCount = channel.state.watcher_count;
  const memberCount = channel?.data?.member_count;

  const memberCountText = `${memberCount} Members`;
  const onlineCountText = watchersCount > 0 ? `${watchersCount} Online` : '';

  return `${[memberCountText, onlineCountText].join(',')}`;
};
