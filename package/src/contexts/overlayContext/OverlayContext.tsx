import React, { useContext } from 'react';
import type Animated from 'react-native-reanimated';

import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import type { AttachmentPickerProps } from '../../components/AttachmentPicker/AttachmentPicker';
import type { ImageGalleryCustomComponents } from '../../components/ImageGallery/ImageGallery';
import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
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
  ImageGalleryCustomComponents<Us> &
  Partial<
    Pick<
      MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>,
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
    message?: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
    messageReactions?: boolean;
    messageTextNumberOfLines?: number;
    numberOfImageGalleryGridColumns?: number;
    openPicker?: (ref: React.RefObject<BottomSheetMethods>) => void;
    value?: Partial<OverlayContextValue>;
  };

export const useOverlayContext = () => useContext(OverlayContext);

export const withOverlayContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof OverlayContextValue>> => {
  const WithOverlayContextComponent = (props: Omit<P, keyof OverlayContextValue>) => {
    const overlayContext = useOverlayContext();

    return <Component {...(props as P)} {...overlayContext} />;
  };
  WithOverlayContextComponent.displayName = `WithOverlayContext${getDisplayName(Component)}`;
  return WithOverlayContextComponent;
};
