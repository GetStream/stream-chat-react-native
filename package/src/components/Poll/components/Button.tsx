import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Poll, PollOption } from 'stream-chat';

import { useTheme } from '../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageType } from '../../MessageList/hooks/useMessageList';

export type PollButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  onPress?: ({
    message,
    poll,
  }: {
    message: MessageType<StreamChatGenerics>;
    poll: Poll<StreamChatGenerics>;
  }) => void;
};

export type PollVoteButtonProps = {
  option: PollOption;
} & Pick<PollButtonProps, 'onPress'>;

export const GenericPollButton = ({ onPress, title }: { onPress?: () => void; title?: string }) => {
  const {
    theme: {
      colors: { accent_dark_blue },
      poll: {
        button: { container, text },
      },
    },
  } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, styles.container, container]}
    >
      <Text style={[styles.text, { color: accent_dark_blue }, text]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 11,
  },
  text: { fontSize: 16 },
});
