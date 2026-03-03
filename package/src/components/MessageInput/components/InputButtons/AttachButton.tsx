import React from 'react';
import type { GestureResponderEvent } from 'react-native';

import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useStableCallback } from '../../../../hooks';
import { Plus } from '../../../../icons/Plus';
import { Button } from '../../../ui/';

type AttachButtonPropsWithContext = Pick<MessageInputContextValue, 'handleAttachButtonPress'> &
  Pick<AttachmentPickerContextValue, 'disableAttachmentPicker'> & {
    disabled?: boolean;
    /** Function that opens attachment options bottom sheet */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  } & { toggleAttachmentPicker: () => void };

const AttachButtonWithContext = (props: AttachButtonPropsWithContext) => {
  const {
    disabled = false,
    handleAttachButtonPress,
    handleOnPress,
    toggleAttachmentPicker,
  } = props;

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
    toggleAttachmentPicker();
  };

  return (
    <Button
      variant='secondary'
      type='outline'
      size='lg'
      iconOnly
      LeadingIcon={Plus}
      onPress={onPressHandler}
      disabled={disabled}
      testID='attach-button'
    />
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
  const { inputBoxRef, handleAttachButtonPress, openAttachmentPicker } = useMessageInputContext();
  const { attachmentPickerStore } = useAttachmentPickerContext();

  const toggleAttachmentPicker = useStableCallback(() => {
    if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
      inputBoxRef.current?.focus();
    } else {
      openAttachmentPicker();
    }
  });

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
