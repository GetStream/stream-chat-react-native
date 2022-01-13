import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Attach } from '../../icons/Attach';

import type { StreamChatGenerics } from '../../types/types';

type AttachButtonPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  selectedPicker?: 'images';
};

const AttachButtonWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled, handleOnPress, selectedPicker } = props;
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { attachButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      hitSlop={{ bottom: 15, left: 15, right: 5, top: 15 }}
      onPress={disabled ? () => null : handleOnPress}
      style={[attachButton]}
      testID='attach-button'
    >
      <Attach pathFill={selectedPicker === 'images' ? accent_blue : grey} />
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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

export type AttachButtonProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AttachButton = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: AttachButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { selectedPicker } = useAttachmentPickerContext();

  return <MemoizedAttachButton {...{ disabled, selectedPicker }} {...props} />;
};

AttachButton.displayName = 'AttachButton{messageInput}';
