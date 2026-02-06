import React, { useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent, LayoutRectangle } from 'react-native';

import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useAttachmentPickerState } from '../../../../hooks/useAttachmentPickerState';
import { NewPlus } from '../../../../icons/NewPlus';
import { Button } from '../../../ui/';
import { NativeAttachmentPicker } from '../NativeAttachmentPicker';

type AttachButtonPropsWithContext = Pick<
  MessageInputContextValue,
  'handleAttachButtonPress' | 'toggleAttachmentPicker'
> &
  Pick<AttachmentPickerContextValue, 'disableAttachmentPicker'> & {
    disabled?: boolean;
    /** Function that opens attachment options bottom sheet */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const AttachButtonWithContext = (props: AttachButtonPropsWithContext) => {
  const [showAttachButtonPicker, setShowAttachButtonPicker] = useState<boolean>(false);
  const [attachButtonLayoutRectangle, setAttachButtonLayoutRectangle] = useState<LayoutRectangle>();
  const {
    disableAttachmentPicker,
    disabled = false,
    handleAttachButtonPress,
    handleOnPress,
    toggleAttachmentPicker,
  } = props;
  const { selectedPicker } = useAttachmentPickerState();

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
    if (!disableAttachmentPicker) {
      toggleAttachmentPicker();
    } else {
      attachButtonHandler();
    }
  };

  return (
    <>
      <Button
        variant='secondary'
        type='outline'
        size='lg'
        iconOnly
        LeadingIcon={NewPlus}
        onLayout={onAttachButtonLayout}
        onPress={onPressHandler}
        selected={selectedPicker === 'images'}
        disabled={disabled}
        testID='attach-button'
      />
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
  const { handleOnPress: prevHandleOnPress } = prevProps;
  const { handleOnPress: nextHandleOnPress } = nextProps;

  const handleOnPressEqual = prevHandleOnPress === nextHandleOnPress;
  if (!handleOnPressEqual) {
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
  const { disableAttachmentPicker } = useAttachmentPickerContext();
  const { handleAttachButtonPress, toggleAttachmentPicker } = useMessageInputContext();

  return (
    <MemoizedAttachButton
      {...{
        disableAttachmentPicker,
        handleAttachButtonPress,
        toggleAttachmentPicker,
      }}
      {...props}
    />
  );
};

AttachButton.displayName = 'AttachButton{messageInput}';
