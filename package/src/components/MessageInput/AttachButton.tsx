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

import type { DefaultStreamChatGenerics } from '../../types/types';

type AttachButtonPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatClient>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  selectedPicker?: 'images';
};

const AttachButtonWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachButtonPropsWithContext<StreamChatClient>,
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

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AttachButtonPropsWithContext<StreamChatClient>,
  nextProps: AttachButtonPropsWithContext<StreamChatClient>,
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
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<AttachButtonPropsWithContext<StreamChatClient>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const AttachButton = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachButtonProps<StreamChatClient>,
) => {
  const { disabled = false } = useChannelContext<StreamChatClient>();
  const { selectedPicker } = useAttachmentPickerContext();

  return <MemoizedAttachButton {...{ disabled, selectedPicker }} {...props} />;
};

AttachButton.displayName = 'AttachButton{messageInput}';
