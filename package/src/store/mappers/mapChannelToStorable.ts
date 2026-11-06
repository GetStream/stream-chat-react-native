import type { Channel, ChannelResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapChannelToStorable = (channel: Channel): TableRow<'channels'> | undefined => {
  if (!channel.data) {
    return;
  }
  const {
    auto_translation_enabled,
    auto_translation_language,
    cid,
    config,
    cooldown,
    created_at,
    deleted_at,
    disabled,
    frozen,
    hidden,
    id,
    last_message_at,
    member_count,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    members,
    muted,
    own_capabilities,
    team,
    truncated_at,
    truncated_by,
    type,
    updated_at,
    ...extraData
  } = channel.data as unknown as ChannelResponse;

  return {
    autoTranslationEnabled: auto_translation_enabled,
    autoTranslationLanguage: auto_translation_language,
    cid,
    config: config && JSON.stringify(config),
    cooldown,
    createdAt: mapTimestampToStorable(created_at),
    deletedAt: mapTimestampToStorable(deleted_at),
    disabled,
    extraData: JSON.stringify(extraData),
    frozen,
    hidden,
    id,
    lastMessageAt: mapTimestampToStorable(last_message_at),
    memberCount: member_count,
    muted,
    ownCapabilities: own_capabilities && JSON.stringify(own_capabilities),
    team,
    truncatedAt: mapTimestampToStorable(truncated_at),
    truncatedBy: truncated_by && JSON.stringify(truncated_by),
    truncatedById: truncated_by?.id,
    type,
    updatedAt: mapTimestampToStorable(updated_at),
  };
};
