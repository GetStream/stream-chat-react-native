import React, { useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Delete } from '../../icons/Delete';
import { Mic } from '../../icons/Mic';
import { SendPlane } from '../../icons/SendPlane';
import { Stop } from '../../icons/Stop';

import { Audio } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

type MicInputPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    | 'recording'
    | 'setRecording'
    | 'setRecordingStatus'
    | 'setShowVoiceUI'
    | 'VoiceRecording'
    | 'VoiceRecordingPlayback'
  > & {
    /** Function that opens audio selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const MicInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const [recordingStopped, setRecordingStopped] = useState<boolean>(false);
  const {
    disabled,
    handleOnPress,
    recording,
    setRecording,
    setRecordingStatus,
    setShowVoiceUI,
    VoiceRecording,
    VoiceRecordingPlayback,
  } = props;

  const {
    theme: {
      colors: { accent_blue, accent_red },
      messageInput: { commandsButton },
    },
  } = useTheme();

  const stopRecording = async () => {
    if (recording) {
      // For Expo CLI
      if (typeof recording !== 'string') {
        await recording.stopAndUnloadAsync();
        await Audio.stopRecording();
      }
      // For RN CLI
      else {
        await Audio.stopRecording();
      }
    }
    setRecordingStopped(true);
  };

  const deleteRecording = () => {
    setRecording(undefined);
    setRecordingStatus(undefined);
    setRecordingStopped(false);
    setShowVoiceUI(false);
  };

  return (
    <View style={styles.container}>
      {recording ? !recordingStopped ? <VoiceRecording /> : <VoiceRecordingPlayback /> : null}
      <View style={styles.buttons}>
        {recordingStopped ? (
          <Pressable
            disabled={disabled}
            onPress={deleteRecording}
            style={[commandsButton]}
            testID='delete-button'
          >
            <Delete height={28} pathFill={accent_blue} width={28} />
          </Pressable>
        ) : (
          <>
            <Mic height={25} pathFill={accent_red} width={19} />
            <Pressable
              disabled={disabled}
              onPress={stopRecording}
              style={[commandsButton]}
              testID='stop-button'
            >
              <Stop height={28} pathFill={accent_red} viewBox={`0 0 ${28} ${28}`} width={28} />
            </Pressable>
          </>
        )}
        <Pressable
          disabled={disabled}
          onPress={handleOnPress}
          style={[commandsButton]}
          testID='send-audio-button'
        >
          <SendPlane height={28} pathFill={accent_blue} viewBox={`0 0 ${28} ${28}`} width={28} />
        </Pressable>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MicInputPropsWithContext<StreamChatGenerics>,
  nextProps: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled, recording: prevRecording } = prevProps;
  const { disabled: nextDisabled, recording: nextRecording } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const recordingEqual = prevRecording === nextRecording;
  if (!recordingEqual) return false;

  return true;
};

const MemoizedMicInput = React.memo(MicInputWithContext, areEqual) as typeof MicInputWithContext;

export type MicInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MicInputPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const MicInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicInputProps<StreamChatGenerics>,
) => {
  const { disabled = false } = useChannelContext<StreamChatGenerics>();
  const {
    recording,
    setRecording,
    setRecordingStatus,
    setShowVoiceUI,
    VoiceRecording,
    VoiceRecordingPlayback,
  } = useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedMicInput
      {...{
        disabled,
        recording,
        setRecording,
        setRecordingStatus,
        setShowVoiceUI,
        VoiceRecording,
        VoiceRecordingPlayback,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {},
  recordingDetails: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
});

MicInput.displayName = 'MicInput{messageInput}';
