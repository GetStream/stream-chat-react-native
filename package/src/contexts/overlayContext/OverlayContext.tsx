import React, { useContext } from 'react';
import type Animated from 'react-native-reanimated';

import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import type { AttachmentPickerProps } from '../../components/AttachmentPicker/AttachmentPicker';
import type { ImageGalleryCustomComponents } from '../../components/ImageGallery/ImageGallery';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { Streami18n } from '../../utils/Streami18n';
import type { AttachmentPickerContextValue } from '../attachmentPickerContext/AttachmentPickerContext';
import type { MessageOverlayContextValue } from '../messageOverlayContext/MessageOverlayContext';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';
import { getDisplayName } from '../utils/getDisplayName';

export type Overlay = 'alert' | 'gallery' | 'message' | 'none';

export type OverlayContextValue = {
  overlay: Overlay;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
  style?: DeepPartial<Theme>;
  translucentStatusBar?: boolean;
};

export const OverlayContext = React.createContext<OverlayContextValue>({} as OverlayContextValue);

export type OverlayProviderProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
      | 'topInset'
    >
  > &
  ImageGalleryCustomComponents<StreamChatClient> &
  Partial<
    Pick<
      MessageOverlayContextValue<StreamChatClient>,
      | 'MessageActionList'
      | 'MessageActionListItem'
      | 'OverlayReactionList'
      | 'OverlayReactions'
      | 'OverlayReactionsAvatar'
    >
  > &
  Pick<OverlayContextValue, 'translucentStatusBar'> & {
    overlayOpacity: Animated.SharedValue<number>;
    closePicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
    error?: boolean | Error;
    /** https://github.com/GetStream/stream-chat-react-native/wiki/Internationalization-(i18n) */
    i18nInstance?: Streami18n;
    imageGalleryGridHandleHeight?: number;
    imageGalleryGridSnapPoints?: [string | number, string | number];
    isMyMessage?: boolean;
    isThreadMessage?: boolean;
    message?: MessageType<StreamChatClient>;
    messageReactions?: boolean;
    messageTextNumberOfLines?: number;
    numberOfImageGalleryGridColumns?: number;
    openPicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
    value?: Partial<OverlayContextValue>;
  };

export const useOverlayContext = () => useContext(OverlayContext);

export const withOverlayContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<StreamChatClient>,
): React.FC<Omit<StreamChatClient, keyof OverlayContextValue>> => {
  const WithOverlayContextComponent = (
    props: Omit<StreamChatClient, keyof OverlayContextValue>,
  ) => {
    const overlayContext = useOverlayContext();

    return <Component {...(props as StreamChatClient)} {...overlayContext} />;
  };
  WithOverlayContextComponent.displayName = `WithOverlayContext${getDisplayName(
    Component as React.ComponentType,
  )}`;
  return WithOverlayContextComponent;
};
