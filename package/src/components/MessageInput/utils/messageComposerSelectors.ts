import { MessageComposerState, TextComposerState } from 'stream-chat';

export const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});
