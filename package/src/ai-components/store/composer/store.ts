import { StateStore } from '@stream-io/state-store';

export type ComposerState = {
  text: string;
  custom?: Record<string, unknown>;
};

const DEFAULT_STATE: ComposerState = {
  text: '',
};

export const createNewComposerStore = () =>
  new StateStore<ComposerState>(DEFAULT_STATE);
