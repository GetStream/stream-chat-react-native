import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { useCanScheduleMessages } from '../useCanScheduleMessages';

describe('useCanScheduleMessages', () => {
  let channel: Channel;

  const setScheduledMessagesEnabled = (enabled: boolean) =>
    channel.configState.partialNext({
      scheduledMessages: { ...channel.config.scheduledMessages, enabled },
    });

  const setOwnCapabilities = (ownCapabilities: string[]) => {
    channel.data = { ...channel.data, own_capabilities: ownCapabilities };
    channel.state.partialNext({ ownCapabilities });
  };

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
    setScheduledMessagesEnabled(true);
    setOwnCapabilities(['schedule-message']);
  });

  afterEach(cleanup);

  it('is true when the config allows scheduling and the user has the capability', () => {
    const { result } = renderHook(() => useCanScheduleMessages(channel));

    expect(result.current).toBe(true);
  });

  it('follows the schedule-message capability as it changes', () => {
    const { result } = renderHook(() => useCanScheduleMessages(channel));

    act(() => setOwnCapabilities([]));
    expect(result.current).toBe(false);

    act(() => setOwnCapabilities(['schedule-message']));
    expect(result.current).toBe(true);
  });

  it('follows the scheduled messages config as it changes', () => {
    const { result } = renderHook(() => useCanScheduleMessages(channel));

    act(() => setScheduledMessagesEnabled(false));
    expect(result.current).toBe(false);
  });

  it('is false when there is no channel', () => {
    const { result } = renderHook(() => useCanScheduleMessages());

    expect(result.current).toBe(false);
  });
});
