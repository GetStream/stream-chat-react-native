import { StateStore } from 'stream-chat';

export type SelectedPickerType =
  | 'images'
  | 'files'
  | 'camera-photo'
  | 'camera-video'
  | 'polls'
  | 'commands'
  | string
  | undefined;

export type AttachmentPickerState = {
  selectedPicker: SelectedPickerType;
};

const INITIAL_STATE: AttachmentPickerState = {
  selectedPicker: undefined,
};

export class AttachmentPickerStore {
  public state = new StateStore<AttachmentPickerState>(INITIAL_STATE);
  private lastChanged: number = -1;

  setSelectedPicker(value: SelectedPickerType, debounceClose?: boolean) {
    const now = Date.now();
    if (debounceClose && !value && now - this.lastChanged < 500) {
      return;
    }
    this.lastChanged = now;
    this.state.partialNext({ selectedPicker: value });
  }
}
