import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type AttachmentPickerIconProps = {
  numberOfImageUploads?: number;
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
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  closePicker: () => void;
  openPicker: () => void;
  setBottomInset: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPicker: React.Dispatch<React.SetStateAction<'images' | undefined>>;
  setTopInset: React.Dispatch<React.SetStateAction<number>>;
  topInset: number;

  selectedPicker?: 'images';
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
  const bottomInsetValue = value?.bottomInset;
  const topInsetValue = value?.topInset;

  const [bottomInset, setBottomInset] = useState<number>(bottomInsetValue ?? 0);
  const [selectedPicker, setSelectedPicker] = useState<'images'>();
  const [topInset, setTopInset] = useState<number>(topInsetValue ?? 0);

  useEffect(() => {
    setBottomInset(bottomInsetValue ?? 0);
  }, [bottomInsetValue]);

  useEffect(() => {
    setTopInset(topInsetValue ?? 0);
  }, [topInsetValue]);

  const combinedValue = {
    selectedPicker,
    setBottomInset,
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
