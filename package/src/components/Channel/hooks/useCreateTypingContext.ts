import { useMemo } from 'react';

import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateTypingContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  typing,
}: TypingContextValue<StreamChatGenerics>) => {
  const typingValue = Object.keys(typing).join();

  const typingContext: TypingContextValue<StreamChatGenerics> = useMemo(
    () => ({
      typing,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typingValue],
  );

  return typingContext;
};
