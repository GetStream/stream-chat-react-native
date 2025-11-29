import { StateStore } from '@stream-io/state-store';

export type MessageComposerState = {
  text: string;
  custom?: Record<string, unknown>;
};

const DEFAULT_STATE: MessageComposerState = {
  text: '',
};

export const createNewComposerStore = () =>
  new StateStore<MessageComposerState>(DEFAULT_STATE);
