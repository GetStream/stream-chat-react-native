import { useEffect, useState } from 'react';

import { Channel } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export enum AIStatesEnum {
  Error = 'AI_STATE_ERROR',
  ExternalSources = 'AI_STATE_EXTERNAL_SOURCES',
  Generating = 'AI_STATE_GENERATING',
  Idle = 'AI_STATE_IDLE',
  Thinking = 'AI_STATE_THINKING',
}

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
  channel: Channel<StreamChatGenerics>,
) => {
  const [aiState, setAiState] = useState<AIStatesEnum>(AIStatesEnum.Idle);

  useEffect(() => {
    const indicatorChangedListener = channel.on(
      'ai_indicator_changed',
      (event: Event<StreamChatGenerics>) => {
        const { cid } = event;
        const state = event.state as AIStatesEnum;
        if (channel.cid === cid) {
          setAiState(state);
        }
      },
    );

    const indicatorClearedListener = channel.on('ai_indicator_clear', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStatesEnum.Idle);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
