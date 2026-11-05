// This demo opts into Expo UI. Set EXPO_PUBLIC_ATTACHMENT_PICKER=gorhom to compare the default SDK picker.
export const useExpoAttachmentPicker = process.env.EXPO_PUBLIC_ATTACHMENT_PICKER !== 'gorhom';
export const attachmentPickerPresentation = useExpoAttachmentPicker ? 'modal' : 'inline';
