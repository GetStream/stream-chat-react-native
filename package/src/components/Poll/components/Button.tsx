import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { LocalMessage, Poll, PollOption } from 'stream-chat';

import { Button, ButtonProps } from '../../ui';

export type PollButtonProps = {
  onPress?: ({ message, poll }: { message: LocalMessage; poll: Poll }) => void;
};

export type PollVoteButtonProps = {
  option: PollOption;
  style?: StyleProp<ViewStyle>;
} & Pick<PollButtonProps, 'onPress'>;

export type GenericPollButtonProps = Partial<ButtonProps>;

export const GenericPollButton = ({
  variant = 'secondary',
  type = 'ghost',
  onPress,
  label,
  style,
  size = 'sm',
  ...rest
}: GenericPollButtonProps) => {
  return (
    <Button
      variant={variant}
      type={type}
      label={label}
      onPress={onPress}
      size={size}
      style={style}
      {...rest}
    />
  );
};
