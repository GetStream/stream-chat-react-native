import { useMemo } from 'react';

import type { ExtendableGenerics } from 'stream-chat';

import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateTypingContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  typing,
}: TypingContextValue<StreamChatClient>) => {
  const typingValue = Object.keys(typing).join();

  const typingContext: TypingContextValue<StreamChatClient> = useMemo(
    () => ({
      typing,
    }),
    [typingValue],
  );

  return typingContext;
};
