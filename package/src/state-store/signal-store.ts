import { StateStore } from 'stream-chat';

export type SignalState = {
  signal: boolean;
};

const INITIAL_STATE: SignalState = {
  signal: false,
};

export class SignalStore {
  public state = new StateStore<SignalState>(INITIAL_STATE);

  signal() {
    this.state.partialNext({ signal: true });
    this.state.partialNext({ signal: false });
  }
}
