import { useEffect, useState } from 'react';

import { AIState, Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useIsOnline } from '../../Chat/hooks/useIsOnline';

export const AIStates = {
  Error: 'AI_STATE_ERROR',
  ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  Generating: 'AI_STATE_GENERATING',
  Idle: 'AI_STATE_IDLE',
  Thinking: 'AI_STATE_THINKING',
};

export const useAIState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel?: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext();
  const [aiState, setAiState] = useState<AIState>(AIStates.Idle);
  const { isOnline } = useIsOnline(client);

  useEffect(() => {
    if (!isOnline) {
      setAiState(AIStates.Idle);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!channel) {
      return;
    }

    const indicatorChangedListener = channel.on(
      'ai_indicator.update',
      (event: Event<StreamChatGenerics>) => {
        const { cid } = event;
        const state = event.ai_state as AIState;
        if (channel.cid === cid) {
          setAiState(state);
        }
      },
    );

    const indicatorClearedListener = channel.on('ai_indicator.clear', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStates.Idle);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
