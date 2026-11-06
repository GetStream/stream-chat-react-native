import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import { Channel, ChannelMemberResponse, StreamChat } from 'stream-chat';

import { convertDateToTimestamp } from '../../../../mock-builders/generator/time';
import { useChannelPreviewData } from '../useChannelPreviewData';

describe('useChannelPreviewData', () => {
  const buildMockChannel = (membership: Record<string, unknown>) =>
    ({
      messageComposer: { registerDraftEventSubscriptions: () => () => undefined },
      messagePaginator: { aggregateState: new StateStore({ latestMessage: null }) },
      state: new StateStore({ membership, muteStatus: { muted: false }, read: {} }),
    }) as unknown as Channel;
  const client = { userId: 'me' } as unknown as StreamChat;

  it('does not re-render when re-hydration replaces membership with an equal copy', () => {
    const channel = buildMockChannel({ pinned_at: null, user_id: 'me' });
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useChannelPreviewData(channel, client);
    });
    const rendersBefore = renders;

    act(() => {
      channel.state.partialNext({
        membership: { pinned_at: null, user_id: 'me' } as unknown as ChannelMemberResponse,
      });
    });

    expect(renders).toBe(rendersBefore);
    expect(result.current.pinned).toBe(false);
  });

  it('updates when the channel is pinned', () => {
    const channel = buildMockChannel({ pinned_at: null, user_id: 'me' });
    const { result } = renderHook(() => useChannelPreviewData(channel, client));

    act(() => {
      channel.state.partialNext({
        membership: {
          pinned_at: convertDateToTimestamp('2026-06-15T08:00:00.000Z'),
          user_id: 'me',
        } as unknown as ChannelMemberResponse,
      });
    });

    expect(result.current.pinned).toBe(true);
  });
});
