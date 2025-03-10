import { useMemo } from 'react';

import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';

export const useCreateTypingContext = ({ typing }: TypingContextValue) => {
  const typingValue = Object.keys(typing).join();

  const typingContext: TypingContextValue = useMemo(
    () => ({
      typing,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typingValue],
  );

  return typingContext;
};
