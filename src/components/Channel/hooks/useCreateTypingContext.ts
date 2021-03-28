import { useMemo } from 'react';

import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreateTypingContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  typing,
}: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const typingValue = Object.keys(typing).join();

  const typingContext: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      typing,
    }),
    [typingValue],
  );

  return typingContext;
};
