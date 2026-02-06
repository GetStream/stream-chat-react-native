import { useStateStore } from './useStateStore';

import { useAttachmentPickerContext } from '../contexts';
import { AttachmentPickerState } from '../state-store/attachment-picker-store';

const selector = (nextState: AttachmentPickerState) => ({
  selectedPicker: nextState.selectedPicker,
});

export const useAttachmentPickerState = () => {
  const { attachmentPickerStore } = useAttachmentPickerContext();
  return useStateStore(attachmentPickerStore.state, selector);
};
