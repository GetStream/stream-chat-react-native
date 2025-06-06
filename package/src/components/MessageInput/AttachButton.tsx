import React, { useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { Pressable } from 'react-native';

import { NativeAttachmentPicker } from './components/NativeAttachmentPicker';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Attach } from '../../icons/Attach';

import { isImageMediaLibraryAvailable } from '../../native';

type AttachButtonPropsWithContext = Pick<
  MessageInputContextValue,
  'handleAttachButtonPress' | 'toggleAttachmentPicker'
> & {
  disabled?: boolean;
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  selectedPicker?: 'images';
};

const AttachButtonWithContext = (props: AttachButtonPropsWithContext) => {
  const [showAttachButtonPicker, setShowAttachButtonPicker] = useState<boolean>(false);
  const [attachButtonLayoutRectangle, setAttachButtonLayoutRectangle] = useState<LayoutRectangle>();
  const {
    disabled = false,
    handleAttachButtonPress,
    handleOnPress,
    selectedPicker,
    toggleAttachmentPicker,
  } = props;
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { attachButton },
    },
  } = useTheme();

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
    setShowAttachButtonPicker((prevShowAttachButtonPicker) => !prevShowAttachButtonPicker);
  };

  const onPressHandler = () => {
    if (disabled) {
      return;
    }
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
        onPress={onPressHandler}
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

const areEqual = (
  prevProps: AttachButtonPropsWithContext,
  nextProps: AttachButtonPropsWithContext,
) => {
  const { handleOnPress: prevHandleOnPress, selectedPicker: prevSelectedPicker } = prevProps;
  const { handleOnPress: nextHandleOnPress, selectedPicker: nextSelectedPicker } = nextProps;

  const handleOnPressEqual = prevHandleOnPress === nextHandleOnPress;
  if (!handleOnPressEqual) {
    return false;
  }

  const selectedPickerEqual = prevSelectedPicker === nextSelectedPicker;
  if (!selectedPickerEqual) {
    return false;
  }

  return true;
};

const MemoizedAttachButton = React.memo(
  AttachButtonWithContext,
  areEqual,
) as typeof AttachButtonWithContext;

export type AttachButtonProps = Partial<AttachButtonPropsWithContext>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AttachButton = (props: AttachButtonProps) => {
  const { selectedPicker } = useAttachmentPickerContext();
  const { handleAttachButtonPress, toggleAttachmentPicker } = useMessageInputContext();

  return (
    <MemoizedAttachButton
      {...{ handleAttachButtonPress, selectedPicker, toggleAttachmentPicker }}
      {...props}
    />
  );
};

AttachButton.displayName = 'AttachButton{messageInput}';
