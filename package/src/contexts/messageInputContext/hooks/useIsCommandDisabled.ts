import { useMemo } from 'react';

import type { CommandSuggestion, MessageComposerState } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

const hasQuotedMessageSelector = (state: MessageComposerState) => ({
  hasQuotedMessage: !!state.quotedMessage,
});

export const useIsCommandDisabled = (command: CommandSuggestion) => {
  const messageComposer = useMessageComposer();
  const { hasQuotedMessage } = useStateStore(messageComposer.state, hasQuotedMessageSelector);

  return useMemo(
    () => messageComposer.isCommandDisabled(command),
    // isCommandDisabled reads quotedMessage through the composer state getter.
    // Keep this dependency scoped to quote presence, not quote object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [command, hasQuotedMessage, messageComposer],
  );
};
