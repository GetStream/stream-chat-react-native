import React, { useCallback } from 'react';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { TextComposerState } from 'stream-chat';

import { EditButton } from './EditButton';

import {
  ChannelContextValue,
  ChatContextValue,
  useChannelContext,
  useChatContext,
  useMessageComposerHasSendableData,
  useTheme,
} from '../../../../contexts';
import { useAttachmentManagerState } from '../../../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { AIStates, useAIState } from '../../../AITypingIndicatorView';
import { AudioRecordingButton } from '../../components/AudioRecorder/AudioRecordingButton';
import { useCountdown } from '../../hooks/useCountdown';

export type OutputButtonsProps = Partial<OutputButtonsWithContextProps>;

export type OutputButtonsWithContextProps = Pick<ChatContextValue, 'isOnline'> &
  Pick<ChannelContextValue, 'channel'> &
  Pick<
    MessageInputContextValue,
    | 'asyncMessagesMinimumPressDuration'
    | 'asyncMessagesSlideToCancelDistance'
    | 'asyncMessagesLockDistance'
    | 'asyncMessagesMultiSendEnabled'
    | 'audioRecordingEnabled'
    | 'cooldownEndsAt'
    | 'CooldownTimer'
    | 'SendButton'
    | 'StopMessageStreamingButton'
    | 'StartAudioRecordingButton'
  >;

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  hasText: !!state.text,
});

export const OutputButtonsWithContext = (props: OutputButtonsWithContextProps) => {
  const {
    channel,
    cooldownEndsAt,
    CooldownTimer,
    isOnline,
    SendButton,
    StopMessageStreamingButton,
  } = props;
  const {
    theme: {
      messageInput: {
        audioRecordingButtonContainer,
        cooldownButtonContainer,
        editButtonContainer,
        sendButtonContainer,
      },
    },
  } = useTheme();

  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { textComposer } = messageComposer;
  const { command, hasText } = useStateStore(textComposer.state, textComposerStateSelector);
  const { attachments } = useAttachmentManagerState();
  const hasSendableData = useMessageComposerHasSendableData();

  const showSendingButton = hasText || attachments.length || command;

  const { seconds: cooldownRemainingSeconds } = useCountdown(cooldownEndsAt);

  const { aiState } = useAIState(channel);
  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    [AIStates.Thinking, AIStates.Generating].includes(aiState) && !!StopMessageStreamingButton;

  if (shouldDisplayStopAIGeneration) {
    return <StopMessageStreamingButton onPress={stopGenerating} />;
  }

  if (editing) {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='cooldown-timer'
        style={editButtonContainer}
      >
        <EditButton disabled={messageComposer.compositionIsEmpty} />
      </Animated.View>
    );
  }

  if (cooldownRemainingSeconds) {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='cooldown-timer'
        style={cooldownButtonContainer}
      >
        <CooldownTimer seconds={cooldownRemainingSeconds} />
      </Animated.View>
    );
  }

  if (showSendingButton) {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='send-button'
        style={sendButtonContainer}
      >
        <SendButton disabled={!hasSendableData || (!!command && !isOnline)} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      key='audio-recording-button'
      style={audioRecordingButtonContainer}
    >
      <AudioRecordingButton />
    </Animated.View>
  );
};

const areEqual = (
  prevProps: OutputButtonsWithContextProps,
  nextProps: OutputButtonsWithContextProps,
) => {
  const { channel: prevChannel, cooldownEndsAt: prevCooldownEndsAt } = prevProps;

  const { channel: nextChannel, cooldownEndsAt: nextCooldownEndsAt } = nextProps;

  if (prevChannel?.cid !== nextChannel?.cid) {
    return false;
  }

  const cooldownEndsAtEqual = prevCooldownEndsAt === nextCooldownEndsAt;
  if (!cooldownEndsAtEqual) {
    return false;
  }

  return true;
};

const MemoizedOutputButtonsWithContext = React.memo(
  OutputButtonsWithContext,
  areEqual,
) as typeof OutputButtonsWithContext;

export const OutputButtons = (props: OutputButtonsProps) => {
  const { isOnline } = useChatContext();
  const { channel } = useChannelContext();
  const {
    audioRecordingEnabled,
    asyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance,
    asyncMessagesLockDistance,
    asyncMessagesMultiSendEnabled,
    cooldownEndsAt,
    CooldownTimer,
    SendButton,
    StopMessageStreamingButton,
    StartAudioRecordingButton,
  } = useMessageInputContext();

  return (
    <MemoizedOutputButtonsWithContext
      {...{
        asyncMessagesLockDistance,
        asyncMessagesMinimumPressDuration,
        asyncMessagesMultiSendEnabled,
        asyncMessagesSlideToCancelDistance,
        audioRecordingEnabled,
        channel,
        cooldownEndsAt,
        CooldownTimer,
        isOnline,
        SendButton,
        StartAudioRecordingButton,
        StopMessageStreamingButton,
      }}
      {...props}
    />
  );
};
