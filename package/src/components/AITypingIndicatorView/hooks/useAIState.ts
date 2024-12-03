import { useEffect, useState } from 'react';

import { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useIsOnline } from '../../Chat/hooks/useIsOnline';

export type AIStateType =
  | 'AI_STATE_ERROR'
  | 'AI_STATE_EXTERNAL_SOURCES'
  | 'AI_STATE_GENERATING'
  | 'AI_STATE_IDLE'
  | 'AI_STATE_THINKING'
  | string;

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
  const [aiState, setAiState] = useState<AIStateType>(AIStates.Idle);
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
        const state = event.ai_state as AIStateType;
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
