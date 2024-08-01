import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Attach } from '../../icons/Attach';

type AttachButtonPropsWithContext = {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  selectedPicker?: 'images';
};

const AttachButtonWithContext = (props: AttachButtonPropsWithContext) => {
  const { handleOnPress, selectedPicker } = props;
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { attachButton },
    },
  } = useTheme();

  return (
    <Pressable onPress={handleOnPress} style={[attachButton]} testID='attach-button'>
      <Attach pathFill={selectedPicker === 'images' ? accent_blue : grey} />
    </Pressable>
  );
};

const areEqual = (
  prevProps: AttachButtonPropsWithContext,
  nextProps: AttachButtonPropsWithContext,
) => {
  const { handleOnPress: prevHandleOnPress, selectedPicker: prevSelectedPicker } = prevProps;
  const { handleOnPress: nextHandleOnPress, selectedPicker: nextSelectedPicker } = nextProps;

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

export type AttachButtonProps = Partial<AttachButtonPropsWithContext>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AttachButton = (props: AttachButtonProps) => {
  const { selectedPicker } = useAttachmentPickerContext();

  return <MemoizedAttachButton {...{ selectedPicker }} {...props} />;
};

AttachButton.displayName = 'AttachButton{messageInput}';
