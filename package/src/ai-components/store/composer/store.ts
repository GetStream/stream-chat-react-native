import { StateStore } from '@stream-io/state-store';

import type { AIChatOption } from '../../message-composer/ChatOptions';

export type ComposerState = {
  text: string;
  /** The chat option picked for the next message. It stays picked after a message is sent. */
  chatOption?: AIChatOption | null;
  custom?: Record<string, unknown>;
};

const DEFAULT_STATE: ComposerState = {
  text: '',
};

export const createNewComposerStore = () => new StateStore<ComposerState>(DEFAULT_STATE);
