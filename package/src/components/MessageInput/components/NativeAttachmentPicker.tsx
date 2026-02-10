import { LayoutRectangle } from 'react-native';

type NativeAttachmentPickerProps = {
  onRequestedClose: () => void;
  attachButtonLayoutRectangle?: LayoutRectangle;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NativeAttachmentPicker = (_props: NativeAttachmentPickerProps) => {
  // TODO: V9: Temporarily removed, will delete the entire component later
  return null;
};
