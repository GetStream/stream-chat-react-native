import { CooldownTimerState } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  isCooldownActive: !!state.cooldownRemaining,
});

export const useIsCooldownActive = () => {
  const { channel } = useChannelContext();
  return useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector).isCooldownActive;
};
