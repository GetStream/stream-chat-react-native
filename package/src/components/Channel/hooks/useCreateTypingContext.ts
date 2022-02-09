import { useMemo } from 'react';

import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateTypingContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
