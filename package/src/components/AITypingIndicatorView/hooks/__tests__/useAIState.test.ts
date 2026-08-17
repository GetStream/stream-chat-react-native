import { act, renderHook } from '@testing-library/react-native';

import { AIStates } from 'stream-chat';

import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { useAIState } from '../useAIState';

describe('useAIState', () => {
  it('returns Idle when no channel is provided', () => {
    const { result } = renderHook(() => useAIState(undefined));
    expect(result.current.aiState).toBe(AIStates.Idle);
  });

  it('reflects channel.state.aiState as the ai_indicator events arrive', async () => {
    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels();

    const { result } = renderHook(() => useAIState(channel));
    expect(result.current.aiState).toBe(AIStates.Idle);

    act(() => {
      client.dispatchEvent({
        ai_state: AIStates.Generating,
        cid: channel.cid,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        custom: {},
        message_id: 'message-id',
        type: 'ai_indicator.update',
      });
    });
    expect(result.current.aiState).toBe(AIStates.Generating);

    act(() => {
      client.dispatchEvent({
        cid: channel.cid,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        custom: {},
        type: 'ai_indicator.clear',
      });
    });
    expect(result.current.aiState).toBe(AIStates.Idle);
  });
});
