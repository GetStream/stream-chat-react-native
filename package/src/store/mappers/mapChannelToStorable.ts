import type { Channel, ChannelResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { TableRow } from '../types';

export const mapChannelToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
): TableRow<'channels'> | undefined => {
  if (!channel.data) return;
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
    invites,
    last_message_at,
    member_count,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    members,
    muted,
    own_capabilities,
    team,
    truncated_at,
    truncated_by,
    truncated_by_id,
    type,
    updated_at,
    ...extraData
  } = channel.data as unknown as ChannelResponse<StreamChatGenerics>;

  return {
    autoTranslationEnabled: auto_translation_enabled,
    autoTranslationLanguage: auto_translation_language,
    cid,
    config: config && JSON.stringify(config),
    cooldown,
    createdAt: mapDateTimeToStorable(created_at),
    deletedAt: mapDateTimeToStorable(deleted_at),
    disabled,
    extraData: JSON.stringify(extraData),
    frozen,
    hidden,
    id,
    invites: invites && JSON.stringify(invites),
    lastMessageAt: mapDateTimeToStorable(last_message_at),
    memberCount: member_count,
    muted,
    ownCapabilities: own_capabilities && JSON.stringify(own_capabilities),
    team,
    truncatedAt: truncated_at,
    truncatedBy: truncated_by && JSON.stringify(truncated_by),
    truncatedById: truncated_by_id,
    type,
    updatedAt: updated_at,
  };
};
