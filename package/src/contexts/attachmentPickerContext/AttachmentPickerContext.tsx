import React, { PropsWithChildren, useContext, useMemo, useState } from 'react';

import BottomSheet from '@gorhom/bottom-sheet';

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
   * Determines the height of the `AttachmentPicker` and how far the `MessageList` shifts when it
   * opens. Set via the `bottomInset` prop on `Channel`.
   */
  bottomInset: number;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  closePicker: () => void;
  openPicker: () => void;
  topInset: number;

  /**
   * Uses the native image picker in place of the in-app image gallery. The attachment picker and
   * its selection bar still render; set `shouldRenderAttachmentPicker` to false to hide them.
   */
  disableAttachmentPicker?: boolean;
  /**
   * Whether the attachment picker renders at all. Defaults to true.
   *
   * When false, `openAttachmentPicker` does nothing and the attach button is still shown, so hide
   * it or override its action with `handleAttachButtonPress`.
   */
  shouldRenderAttachmentPicker?: boolean;
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
      'The useAttachmentPickerContext hook was called outside the AttachmentPickerContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    );
  }

  return contextValue;
};
