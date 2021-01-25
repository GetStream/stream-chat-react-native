import React, { PropsWithChildren, useContext, useState } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { Asset } from '../../native';
import type { UnknownType } from '../../types/types';

export type AttachmentPickerIconProps = {
  numberOfImageUploads: number;
  selectedPicker?: 'images';
};

export type AttachmentPickerContextValue = {
  CameraSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  closePicker: () => void;
  FileSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  ImageSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  maxNumberOfFiles: number;
  openPicker: () => void;
  selectedImages: Asset[];
  setMaxNumberOfFiles: React.Dispatch<React.SetStateAction<number>>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  setSelectedPicker: React.Dispatch<React.SetStateAction<'images' | undefined>>;
  setTopInset: React.Dispatch<React.SetStateAction<number>>;
  attachmentPickerBottomSheetHeight?: number;
  attachmentSelectionBarHeight?: number;
  bottomInset?: number;
  selectedPicker?: 'images';
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
  >;
}>) => {
  const [maxNumberOfFiles, setMaxNumberOfFiles] = useState(10);
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [selectedPicker, setSelectedPicker] = useState<'images'>();
  const [topInset, setTopInset] = useState<number>();

  const combinedValue = {
    maxNumberOfFiles,
    selectedImages,
    selectedPicker,
    setMaxNumberOfFiles,
    setSelectedImages,
    setSelectedPicker,
    setTopInset,
    topInset,
    ...value,
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
