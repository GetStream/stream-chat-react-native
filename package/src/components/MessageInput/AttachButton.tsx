import React, { useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { Pressable } from 'react-native';

import { NativeAttachmentPicker } from './components/NativeAttachmentPicker';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Attach } from '../../icons/Attach';

import { isImageMediaLibraryAvailable } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

type AttachButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  selectedPicker?: 'images';
};

const AttachButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachButtonPropsWithContext<StreamChatGenerics>,
) => {
  const [showAttachButtonPicker, setShowAttachButtonPicker] = useState<boolean>(false);
  const [attachButtonLayoutRectangle, setAttachButtonLayoutRectangle] = useState<LayoutRectangle>();
  const { disabled, handleOnPress, selectedPicker } = props;
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { attachButton },
    },
  } = useTheme();
  const { handleAttachButtonPress, toggleAttachmentPicker } = useMessageInputContext();

  const onAttachButtonLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setAttachButtonLayoutRectangle((prev) => {
      if (
        prev &&
        prev.width === layout.width &&
        prev.height === layout.height &&
        prev.x === layout.x &&
        prev.y === layout.y
      ) {
        return prev;
      }
      return layout;
    });
  };

  const attachButtonHandler = () => {
    setShowAttachButtonPicker(true);
  };

  const onPressHandler = () => {
    if (handleOnPress) {
      handleOnPress();
      return;
    }
    if (handleAttachButtonPress) {
      handleAttachButtonPress();
      return;
    }
    if (isImageMediaLibraryAvailable()) {
      toggleAttachmentPicker();
    } else {
      attachButtonHandler();
    }
  };

  return (
    <>
      <Pressable
        disabled={disabled}
        onLayout={onAttachButtonLayout}
        onPress={disabled ? () => null : onPressHandler}
        style={[attachButton]}
        testID='attach-button'
      >
        <Attach fill={selectedPicker === 'images' ? accent_blue : grey} size={32} />
      </Pressable>
      {showAttachButtonPicker ? (
        <NativeAttachmentPicker
          attachButtonLayoutRectangle={attachButtonLayoutRectangle}
          onRequestedClose={() => setShowAttachButtonPicker(false)}
        />
      ) : null}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AttachButtonPropsWithContext<StreamChatGenerics>,
  nextProps: AttachButtonPropsWithContext<StreamChatGenerics>,
) => {
  const {
    disabled: prevDisabled,
    handleOnPress: prevHandleOnPress,
    selectedPicker: prevSelectedPicker,
  } = prevProps;
  const {
    disabled: nextDisabled,
    handleOnPress: nextHandleOnPress,
    selectedPicker: nextSelectedPicker,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const handleOnPressEqual = prevHandleOnPress === nextHandleOnPress;
  if (!handleOnPressEqual) return false;

  const selectedPickerEqual = prevSelectedPicker === nextSelectedPicker;
  if (!selectedPickerEqual) return false;

  return true;
};

const MemoizedAttachButton = React.memo(
  AttachButtonWithContext,
  areEqual,
) as typeof AttachButtonWithContext;

export type AttachButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AttachButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AttachButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachButtonProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const { selectedPicker } = useAttachmentPickerContext();

  return <MemoizedAttachButton {...{ disabled, selectedPicker }} {...props} />;
};

AttachButton.displayName = 'AttachButton{messageInput}';
