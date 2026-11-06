import type { Channel, ChannelMuteStatus } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const defaultMuteStatus = {
  createdAt: null,
  expiresAt: null,
  muted: false,
};

const selector = (state: { muteStatus: ChannelMuteStatus }) => ({
  muteStatus: state.muteStatus,
});

/**
 * The channel's mute status, read reactively from `channel.state.muteStatus`.
 *
 * @param channel The channel to read.
 * @returns The mute status, which reads as unmuted until the state reports otherwise.
 */
export const useIsChannelMuted = (channel: Channel) =>
  useStateStore(channel?.state, selector)?.muteStatus ?? defaultMuteStatus;
