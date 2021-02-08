import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { Asset } from '../../native';
import type { UnknownType } from '../../types/types';

export type AttachmentPickerIconProps = {
  numberOfImageUploads: number;
  selectedPicker?: 'images';
};

export type AttachmentPickerContextValue = {
  /**
   * Custom UI component for [camera selector icon](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/1.png)
   *
   * **Default: ** [CameraSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/CameraSelectorIcon.tsx)
   */
  CameraSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  closePicker: () => void;
  /**
   * Custom UI component for [file selector icon](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/1.png)
   *
   * **Default: ** [FileSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/FileSelectorIcon.tsx)
   */
  FileSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Custom UI component for [image selector icon](https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/docs/1.png)
   *
   * **Default: ** [ImageSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/src/components/AttachmentPicker/components/ImageSelectorIcon.tsx)
   */
  ImageSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Limit for maximum files that can be attached per message.
   */
  maxNumberOfFiles: number;
  openPicker: () => void;
  selectedImages: Asset[];
  setBottomInset: React.Dispatch<React.SetStateAction<number | undefined>>;
  setMaxNumberOfFiles: React.Dispatch<React.SetStateAction<number>>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  setSelectedPicker: React.Dispatch<React.SetStateAction<'images' | undefined>>;
  setTopInset: React.Dispatch<React.SetStateAction<number | undefined>>;
  attachmentPickerBottomSheetHeight?: number;
  attachmentSelectionBarHeight?: number;
  /**
   * `bottomInset` determine the height of the `AttachmentPicker` and the underlying shift to the `MessageList` when it is opened.
   * This can also be set via the `setBottomInset` function provided by the `useAttachmentPickerContext` hook.
   *
   * Please check [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/COOKBOOK.md#overlayprovider) section in Cookbook
   * for more details.
   */
  bottomInset?: number;
  selectedPicker?: 'images';
  /**
   * `topInset` must be set to ensure that when the picker is completely open it is opened to the desired height.
   * This can be done via props, but can also be set via the `setTopInset` function provided by the
   * `useAttachmentPickerContext` hook. The bottom sheet will not render without this height set, but it can be
   * set to 0 to cover the entire screen, or the safe area top inset if desired.
   *
   * Please check [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/blob/v2-designs/COOKBOOK.md#overlayprovider) section in Cookbook
   * for more details.
   */
  topInset?: number;
};

export const AttachmentPickerContext = React.createContext<AttachmentPickerContextValue>(
  {} as AttachmentPickerContextValue,
);

export const AttachmentPickerProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: Pick<
    AttachmentPickerContextValue,
    | 'attachmentSelectionBarHeight'
    | 'attachmentPickerBottomSheetHeight'
    | 'bottomInset'
    | 'CameraSelectorIcon'
    | 'closePicker'
    | 'FileSelectorIcon'
    | 'ImageSelectorIcon'
    | 'openPicker'
    | 'topInset'
  >;
}>) => {
  const bottomInsetValue = value?.bottomInset;
  const topInsetValue = value?.topInset;

  const [bottomInset, setBottomInset] = useState<number | undefined>(
    bottomInsetValue,
  );
  const [maxNumberOfFiles, setMaxNumberOfFiles] = useState(10);
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [selectedPicker, setSelectedPicker] = useState<'images'>();
  const [topInset, setTopInset] = useState<number | undefined>(value?.topInset);

  useEffect(() => {
    setBottomInset(bottomInsetValue);
  }, [bottomInsetValue]);

  useEffect(() => {
    setTopInset(topInsetValue);
  }, [topInsetValue]);

  const combinedValue = {
    maxNumberOfFiles,
    selectedImages,
    selectedPicker,
    setBottomInset,
    setMaxNumberOfFiles,
    setSelectedImages,
    setSelectedPicker,
    setTopInset,
    ...value,
    bottomInset,
    topInset,
  };

  return (
    <AttachmentPickerContext.Provider
      value={(combinedValue as unknown) as AttachmentPickerContextValue}
    >
      {children}
    </AttachmentPickerContext.Provider>
  );
};

export const useAttachmentPickerContext = () =>
  (useContext(
    AttachmentPickerContext,
  ) as unknown) as AttachmentPickerContextValue;

export const withAttachmentPickerContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof AttachmentPickerContextValue>> => {
  const WithAttachmentPickerContextComponent = (
    props: Omit<P, keyof AttachmentPickerContextValue>,
  ) => {
    const attachmentPickerContext = useAttachmentPickerContext();

    return <Component {...(props as P)} {...attachmentPickerContext} />;
  };
  WithAttachmentPickerContextComponent.displayName = `WithAttachmentPickerContext${getDisplayName(
    Component,
  )}`;
  return WithAttachmentPickerContextComponent;
};
