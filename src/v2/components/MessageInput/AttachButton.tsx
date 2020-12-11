import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Attach } from '../../icons/Attach';

import type { GestureResponderEvent } from 'react-native';

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

type AttachButtonPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'disabled'> & {
  /** Function that opens attachment options bottom sheet */
  handleOnPress?: (event: GestureResponderEvent) => void;
  selectedPicker?: 'images';
};

const AttachButtonWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled, handleOnPress, selectedPicker } = props;
  const {
    theme: {
      colors: { primary, textGrey },
      messageInput: { attachButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnPress}
      style={[attachButton]}
      testID='attach-button'
    >
      <Attach pathFill={selectedPicker === 'images' ? primary : textGrey} />
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
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
  return (
    prevDisabled === nextDisabled &&
    prevHandleOnPress === nextHandleOnPress &&
    prevSelectedPicker === nextSelectedPicker
  );
};

const MemoizedAttachButton = React.memo(
  AttachButtonWithContext,
  areEqual,
) as typeof AttachButtonWithContext;

export type AttachButtonProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<AttachButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for attach button in MessageInput component.
 *
 * @example ./AttachButton.md
 */
export const AttachButton = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: AttachButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { selectedPicker } = useAttachmentPickerContext();

  return <MemoizedAttachButton {...{ disabled, selectedPicker }} {...props} />;
};

AttachButton.displayName = 'AttachButton{messageInput}';
