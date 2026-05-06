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
import { useAttachmentPickerState } from '../../../../hooks/useAttachmentPickerState';
import { Plus } from '../../../../icons/plus';
import { Button } from '../../../ui/';

type AttachButtonPropsWithContext = Pick<MessageInputContextValue, 'handleAttachButtonPress'> &
  Pick<AttachmentPickerContextValue, 'disableAttachmentPicker'> & {
    disabled?: boolean;
    /** Function that opens attachment options bottom sheet */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
    isAttachmentPickerOpen?: boolean;
  } & { toggleAttachmentPicker: () => void };

const AttachButtonWithContext = (props: AttachButtonPropsWithContext) => {
  const {
    disabled = false,
    handleAttachButtonPress,
    handleOnPress,
    isAttachmentPickerOpen = false,
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
      accessibilityLabelKey={
        isAttachmentPickerOpen ? 'a11y/Close attachments' : 'a11y/Add attachment'
      }
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
  const { handleOnPress: prevHandleOnPress, isAttachmentPickerOpen: prevIsAttachmentPickerOpen } =
    prevProps;
  const { handleOnPress: nextHandleOnPress, isAttachmentPickerOpen: nextIsAttachmentPickerOpen } =
    nextProps;

  const handleOnPressEqual = prevHandleOnPress === nextHandleOnPress;
  if (!handleOnPressEqual) {
    return false;
  }

  return prevIsAttachmentPickerOpen === nextIsAttachmentPickerOpen;
};

const MemoizedAttachButton = React.memo(
  AttachButtonWithContext,
  areEqual,
) as typeof AttachButtonWithContext;

export type AttachButtonProps = Partial<AttachButtonPropsWithContext>;

/**
 * UI Component for attach button in MessageComposer component.
 */
export const AttachButton = (props: AttachButtonProps) => {
  const { disableAttachmentPicker } = useAttachmentPickerContext();
  const { inputBoxRef, handleAttachButtonPress, openAttachmentPicker } = useMessageInputContext();
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

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
        isAttachmentPickerOpen: !!selectedPicker,
        toggleAttachmentPicker,
      }}
      {...props}
    />
  );
};

AttachButton.displayName = 'AttachButton{messageComposer}';
