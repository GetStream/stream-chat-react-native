import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { TableRow } from '../types';

export const mapStorableToChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelRow: TableRow<'channels'>,
): Omit<
  ChannelAPIResponse<StreamChatGenerics>,
  'duration' | 'messages' | 'members' | 'pinned_messages'
> => {
  const {
    autoTranslationEnabled,
    autoTranslationLanguage,
    cid,
    config,
    cooldown,
    createdAt,
    createdById,
    deletedAt,
    disabled,
    extraData,
    frozen,
    hidden,
    id,
    invites,
    lastMessageAt,
    memberCount,
    muted,
    ownCapabilities,
    team,
    truncatedAt,
    truncatedBy,
    truncatedById,
    type,
    updatedAt,
  } = channelRow;

  return {
    channel: {
      auto_translation_enabled: autoTranslationEnabled,
      auto_translation_language: autoTranslationLanguage,
      cid,
      config: config && JSON.parse(config),
      cooldown,
      created_at: createdAt,
      created_by_id: createdById,
      deleted_at: deletedAt,
      disabled,
      frozen,
      hidden,
      id,
      invites: invites && JSON.parse(invites),
      last_message_at: lastMessageAt,
      member_count: memberCount,
      muted,
      own_capabilities: ownCapabilities && JSON.parse(ownCapabilities),
      team,
      truncated_at: truncatedAt,
      truncated_by: truncatedBy,
      truncated_by_id: truncatedById,
      type,
      updated_at: updatedAt,
      ...(extraData ? JSON.parse(extraData) : {}),
    },
  };
};
