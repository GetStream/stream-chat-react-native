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
import { useHasAttachments } from '../../../../contexts/messageInputContext/hooks/useHasAttachments';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useStateStore } from '../../../../hooks/useStateStore';
import { AIStates, useAIState } from '../../../AITypingIndicatorView';
import { useIsCooldownActive } from '../../hooks/useIsCooldownActive';

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
    | 'CooldownTimer'
    | 'SendButton'
    | 'StopMessageStreamingButton'
    | 'StartAudioRecordingButton'
  > & {
    cooldownIsActive: boolean;
    hasAttachments: boolean;
  };

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  textIsEmpty: !state.text,
});

export const OutputButtonsWithContext = (props: OutputButtonsWithContextProps) => {
  const {
    audioRecordingEnabled,
    channel,
    CooldownTimer,
    cooldownIsActive,
    isOnline,
    SendButton,
    StopMessageStreamingButton,
    StartAudioRecordingButton,
    hasAttachments,
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
  const { command, textIsEmpty } = useStateStore(textComposer.state, textComposerStateSelector);
  const hasSendableData = useMessageComposerHasSendableData();

  const { aiState } = useAIState(channel);
  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    [AIStates.Thinking, AIStates.Generating].includes(aiState) && !!StopMessageStreamingButton;

  if (shouldDisplayStopAIGeneration) {
    return <StopMessageStreamingButton onPress={stopGenerating} />;
  } else if (editing || command) {
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
  } else if (cooldownIsActive) {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='cooldown-timer'
        style={cooldownButtonContainer}
      >
        <CooldownTimer />
      </Animated.View>
    );
  } else if (audioRecordingEnabled && textIsEmpty && !hasAttachments) {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='audio-recording-button'
        style={audioRecordingButtonContainer}
      >
        <StartAudioRecordingButton />
      </Animated.View>
    );
  } else {
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
};

const areEqual = (
  prevProps: OutputButtonsWithContextProps,
  nextProps: OutputButtonsWithContextProps,
) => {
  const {
    channel: prevChannel,
    cooldownIsActive: prevCooldownIsActive,
    hasAttachments: prevHasAttachments,
  } = prevProps;

  const {
    channel: nextChannel,
    cooldownIsActive: nextCooldownIsActive,
    hasAttachments: nextHasAttachments,
  } = nextProps;

  if (prevChannel?.cid !== nextChannel?.cid) {
    return false;
  }

  const cooldownIsActiveEqual = prevCooldownIsActive === nextCooldownIsActive;
  if (!cooldownIsActiveEqual) {
    return false;
  }

  const hasAttachmentsEqual = prevHasAttachments === nextHasAttachments;
  if (!hasAttachmentsEqual) {
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
    CooldownTimer,
    SendButton,
    StopMessageStreamingButton,
    StartAudioRecordingButton,
  } = useMessageInputContext();
  const cooldownIsActive = useIsCooldownActive();
  const hasAttachments = useHasAttachments();

  return (
    <MemoizedOutputButtonsWithContext
      {...{
        asyncMessagesLockDistance,
        asyncMessagesMinimumPressDuration,
        asyncMessagesMultiSendEnabled,
        asyncMessagesSlideToCancelDistance,
        audioRecordingEnabled,
        channel,
        cooldownIsActive,
        CooldownTimer,
        isOnline,
        SendButton,
        StartAudioRecordingButton,
        StopMessageStreamingButton,
        hasAttachments,
      }}
      {...props}
    />
  );
};
