import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import type { Asset } from '../../native';
import type { UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type AttachmentPickerIconProps = {
  numberOfImageUploads: number;
  selectedPicker?: 'images';
};

export type AttachmentPickerContextValue = {
  /**
   * `bottomInset` determine the height of the `AttachmentPicker` and the underlying shift to the `MessageList` when it is opened.
   * This can also be set via the `setBottomInset` function provided by the `useAttachmentPickerContext` hook.
   *
   * Please check [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#overlayprovider) section in Cookbook
   * for more details.
   */
  bottomInset: number;
  /**
   * Custom UI component for [camera selector icon](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/1.png)
   *
   * **Default: ** [CameraSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentPicker/components/CameraSelectorIcon.tsx)
   */
  CameraSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  closePicker: () => void;
  /**
   * Custom UI component for [file selector icon](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/1.png)
   *
   * **Default: ** [FileSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentPicker/components/FileSelectorIcon.tsx)
   */
  FileSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Custom UI component for [image selector icon](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/1.png)
   *
   * **Default: ** [ImageSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentPicker/components/ImageSelectorIcon.tsx)
   */
  ImageSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Limit for maximum files that can be attached per message.
   */
  maxNumberOfFiles: number;
  openPicker: () => void;
  selectedImages: Asset[];
  setBottomInset: React.Dispatch<React.SetStateAction<number>>;
  setMaxNumberOfFiles: React.Dispatch<React.SetStateAction<number>>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  setSelectedPicker: React.Dispatch<React.SetStateAction<'images' | undefined>>;
  setTopInset: React.Dispatch<React.SetStateAction<number>>;
  topInset: number;
  attachmentPickerBottomSheetHeight?: number;
  attachmentSelectionBarHeight?: number;
  selectedPicker?: 'images';
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
    | 'CameraSelectorIcon'
    | 'closePicker'
    | 'FileSelectorIcon'
    | 'ImageSelectorIcon'
    | 'openPicker'
  > &
    Partial<Pick<AttachmentPickerContextValue, 'bottomInset' | 'topInset'>>;
}>) => {
  const bottomInsetValue = value?.bottomInset;
  const topInsetValue = value?.topInset;

  const [bottomInset, setBottomInset] = useState<number>(bottomInsetValue ?? 0);
  const [maxNumberOfFiles, setMaxNumberOfFiles] = useState(10);
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [selectedPicker, setSelectedPicker] = useState<'images'>();
  const [topInset, setTopInset] = useState<number>(value?.topInset ?? 0);

  useEffect(() => {
    setBottomInset(bottomInsetValue ?? 0);
  }, [bottomInsetValue]);

  useEffect(() => {
    setTopInset(topInsetValue ?? 0);
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
      value={combinedValue as unknown as AttachmentPickerContextValue}
    >
      {children}
    </AttachmentPickerContext.Provider>
  );
};

export const useAttachmentPickerContext = (componentName?: string) => {
  const contextValue = useContext(
    AttachmentPickerContext,
  ) as unknown as AttachmentPickerContextValue;

  if (!contextValue) {
    console.warn(
      `The useMessageOverlayContext hook was called outside the MessageOverlayContext Provider. Make sure this hook is called within a child of the OverlayProvider component. The errored call is located in the ${componentName} component.`,
    );

    return {} as AttachmentPickerContextValue;
  }

  return contextValue as AttachmentPickerContextValue;
};

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
