import type { Channel } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const defaultMuteStatus = {
  createdAt: null,
  expiresAt: null,
  muted: false,
};

const selector = (state: {
  // Mirrors core's `ChannelMuteStatus`: both timestamps are unix nanoseconds.
  muteStatus: { createdAt: number | null; expiresAt: number | null; muted: boolean };
}) => ({ muteStatus: state.muteStatus });

/**
 * Returns this channel's mute status, sourced reactively from `channel.state.muteStatus` (kept in
 * sync with `client.mutedChannels` on `notification.channel_mutes_updated` / `health.check`).
 */
export const useIsChannelMuted = (channel: Channel) =>
  useStateStore(channel?.state, selector)?.muteStatus ?? defaultMuteStatus;
