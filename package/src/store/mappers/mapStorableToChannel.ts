import type { ChannelStateResponseFields } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';

import type { TableRow } from '../types';

export const mapStorableToChannel = (
  channelRow: TableRow<'channels'>,
): Omit<
  ChannelStateResponseFields,
  'duration' | 'messages' | 'members' | 'pinned_messages' | 'threads'
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
      created_at: mapStorableToTimestamp(createdAt),
      created_by_id: createdById,
      deleted_at: mapStorableToTimestamp(deletedAt),
      disabled,
      frozen,
      hidden,
      id,
      invites: invites && JSON.parse(invites),
      last_message_at: mapStorableToTimestamp(lastMessageAt),
      member_count: memberCount,
      muted,
      own_capabilities: ownCapabilities && JSON.parse(ownCapabilities),
      team,
      truncated_at: mapStorableToTimestamp(truncatedAt),
      truncated_by: truncatedBy,
      truncated_by_id: truncatedById,
      type,
      updated_at: mapStorableToTimestamp(updatedAt),
      ...(extraData ? JSON.parse(extraData) : {}),
    },
  };
};
