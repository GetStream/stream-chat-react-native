import { type CooldownTimerState } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  cooldownRemaining: state.cooldownRemaining,
});

/**
 * The seconds left of the channel cooldown, or 0 when there is none. It reads
 * `channel.cooldownTimer`, so the remaining time is correct after a reload.
 *
 * @returns Seconds left of the cooldown.
 */
export const useCooldownRemaining = (): number => {
  const { channel } = useChannelContext();
  return (
    useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector).cooldownRemaining ?? 0
  );
};
