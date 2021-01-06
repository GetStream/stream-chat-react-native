import React, { useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import type { AttachmentPickerContextValue } from '../attachmentPickerContext/AttachmentPickerContext';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';

import type { AttachmentPickerProps } from '../../components/AttachmentPicker/AttachmentPicker';
import type { ImageGalleryCustomComponents } from '../../components/ImageGallery/ImageGallery';
import type { DefaultUserType, UnknownType } from '../../types/types';
import type { Streami18n } from '../../utils/Streami18n';

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay =
  | 'alert'
  | 'channelInfo'
  | 'gallery'
  | 'message'
  | 'none'
  | 'wildcard';

export type OverlayContextValue = {
  overlay: Overlay;
  setBlurType: React.Dispatch<React.SetStateAction<BlurType>>;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  setWildcard: React.Dispatch<
    React.SetStateAction<
      | React.ComponentType<{
          visible: boolean;
        }>
      | undefined
    >
  >;
  style?: DeepPartial<Theme>;
  Wildcard?: React.ComponentType<{ visible: boolean }>;
};

export const OverlayContext = React.createContext<OverlayContextValue>(
  {} as OverlayContextValue,
);

export type OverlayProviderProps<
  Us extends UnknownType = DefaultUserType
> = Partial<AttachmentPickerProps> &
  Partial<
    Pick<
      AttachmentPickerContextValue,
      | 'attachmentPickerBottomSheetHeight'
      | 'attachmentSelectionBarHeight'
      | 'bottomInset'
      | 'CameraSelectorIcon'
      | 'FileSelectorIcon'
      | 'ImageSelectorIcon'
    >
  > &
  ImageGalleryCustomComponents<Us> & {
    closePicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
    i18nInstance?: Streami18n;
    imageGalleryGridHandleHeight?: number;
    imageGalleryGridSnapPoints?: [string | number, string | number];
    numberOfImageGalleryGridColumns?: number;
    openPicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
    value?: Partial<OverlayContextValue>;
  };

export const useOverlayContext = () => useContext(OverlayContext);

export const withOverlayContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof OverlayContextValue>> => {
  const WithOverlayContextComponent = (
    props: Omit<P, keyof OverlayContextValue>,
  ) => {
    const overlayContext = useOverlayContext();

    return <Component {...(props as P)} {...overlayContext} />;
  };
  WithOverlayContextComponent.displayName = `WithOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithOverlayContextComponent;
};
