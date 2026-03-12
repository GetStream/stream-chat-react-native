import React, { PropsWithChildren, useContext, useMemo, useState } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';

import { AttachmentPickerContentProps } from '../../components';
import {
  AttachmentPickerStore,
  SelectedPickerType,
} from '../../state-store/attachment-picker-store';
import { MessageInputContextValue } from '../messageInputContext/MessageInputContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type AttachmentPickerIconProps = {
  numberOfImageUploads?: number;
  selectedPicker: SelectedPickerType;
};

export type AttachmentPickerContextValue = Pick<
  MessageInputContextValue,
  'attachmentSelectionBarHeight' | 'attachmentPickerBottomSheetHeight'
> & {
  /**
   * Custom UI Component to render select more photos for selected gallery access in iOS.
   */
  AttachmentPickerIOSSelectMorePhotos: React.ComponentType;
  /**
   * `bottomInset` determine the height of the `AttachmentPicker` and the underlying shift to the `MessageList` when it is opened.
   * This can also be set via the `setBottomInset` function provided by the `useAttachmentPickerContext` hook.
   *
   * Please check [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#overlayprovider) section in Cookbook
   * for more details.
   */
  bottomInset: number;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  closePicker: () => void;
  openPicker: () => void;
  topInset: number;

  disableAttachmentPicker?: boolean;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected
   * image](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) (with tick mark)
   *
   * **Default**
   * [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
   */
  ImageOverlaySelectedComponent: React.ComponentType<{ index: number }>;
  AttachmentPickerSelectionBar: React.ComponentType;
  AttachmentPickerContent: React.ComponentType<AttachmentPickerContentProps>;
  attachmentPickerStore: AttachmentPickerStore;
  numberOfAttachmentPickerImageColumns?: number;
  numberOfAttachmentImagesToLoadPerCall?: number;
};

export const AttachmentPickerContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as AttachmentPickerContextValue,
);

export const AttachmentPickerProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: Pick<AttachmentPickerContextValue, 'closePicker' | 'openPicker'> &
    Partial<Pick<AttachmentPickerContextValue, 'bottomInset' | 'topInset'>>;
}>) => {
  const { bottomInset = 0, topInset = 0, ...rest } = value ?? {};
  const [attachmentPickerStore] = useState(() => new AttachmentPickerStore());

  const combinedValue = useMemo(
    () => ({
      bottomInset,
      topInset,
      attachmentPickerStore,
      ...rest,
    }),
    [bottomInset, topInset, attachmentPickerStore, rest],
  );

  return (
    <AttachmentPickerContext.Provider
      value={combinedValue as unknown as AttachmentPickerContextValue}
    >
      {children}
    </AttachmentPickerContext.Provider>
  );
};

export const useAttachmentPickerContext = () => {
  const contextValue = useContext(
    AttachmentPickerContext,
  ) as unknown as AttachmentPickerContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useAttachmentPickerContext hook was called outside the AttachmentPickerContext provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue;
};
