import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import dayjs from 'dayjs';

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

import { Audio, AudioReturnType, RecordingStatus } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

type MicInputPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> &
  Pick<MessageInputContextValue<StreamChatGenerics>, 'showVoiceUI' | 'setShowVoiceUI'> & {
    /** Function that opens audio selector */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
  };

const MicInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const [recording, setRecording] = useState<AudioReturnType | string | undefined>(undefined);
  const [recordingStopped, setRecordingStopped] = useState<boolean>(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus | undefined>(undefined);
  const { disabled, handleOnPress } = props;

  const {
    theme: {
      colors: { accent_blue, accent_red, grey_dark },
      messageInput: { commandsButton },
    },
  } = useTheme();

  const onRecordingStatusUpdate = (status: RecordingStatus) => {
    if (status.isRecording) setRecordingStatus(status);
  };

  const startRecording = async () => {
    const recording = await Audio.startRecording(onRecordingStatusUpdate);
    setRecording(recording);
  };

  const stopRecording = async () => {
    if (recording) {
      // For Expo CLI
      if (typeof recording !== 'string') {
        await recording.stopAndUnloadAsync();
        await Audio.stopRecording();
        const uri = await recording.getURI();
        console.log('Recording URI', uri);
      }
      // For RN CLI
      else {
        const recording = await Audio.stopRecording();
        console.log(recording);
      }
    }
    setRecordingStopped(true);
  };

  const deleteRecording = () => {
    setRecording(undefined);
    setRecordingStopped(false);
  };

  return (
    <View style={styles.container}>
      {recording ? (
        !recordingStopped ? (
          <View style={styles.recordingDetails}>
            <Text style={{ color: grey_dark, fontSize: 15 }}>Recording</Text>
            <Text style={{ color: grey_dark, fontSize: 24, marginVertical: 5 }}>
              {recordingStatus
                ? dayjs.duration(recordingStatus.durationMillis).format('mm:ss')
                : null}
            </Text>
          </View>
        ) : (
          <View style={styles.recordingDetails}>
            <Text style={{ color: grey_dark, fontSize: 24 }}>
              {recordingStatus
                ? dayjs.duration(recordingStatus.durationMillis).format('mm:ss')
                : null}
            </Text>
          </View>
        )
      ) : null}
      <View style={styles.buttons}>
        {recordingStopped ? (
          <TouchableOpacity
            disabled={disabled}
            hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
            onPress={deleteRecording}
            style={[commandsButton]}
            testID='delete-button'
          >
            <Delete height={28} pathFill={accent_blue} width={19} />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              disabled={disabled}
              hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
              onPress={startRecording}
              style={[commandsButton]}
              testID='mic-button'
            >
              <Mic height={25} pathFill={accent_red} width={19} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={disabled}
              hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
              onPress={stopRecording}
              style={[commandsButton]}
              testID='stop-button'
            >
              <Stop height={28} pathFill={accent_red} viewBox={`0 0 ${28} ${28}`} width={28} />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          disabled={disabled}
          hitSlop={{ bottom: 15, left: 5, right: 15, top: 15 }}
          onPress={handleOnPress}
          style={[commandsButton]}
          testID='send-audio-button'
        >
          <SendPlane height={28} pathFill={accent_blue} viewBox={`0 0 ${28} ${28}`} width={28} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MicInputPropsWithContext<StreamChatGenerics>,
  nextProps: MicInputPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled: prevDisabled, showVoiceUI: prevShowVoiceUI } = prevProps;
  const { disabled: nextDisabled, showVoiceUI: nextShowVoiceUI } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const showVoiceUIEqual = prevShowVoiceUI === nextShowVoiceUI;
  if (!showVoiceUIEqual) return false;

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
  const { setShowVoiceUI, showVoiceUI } = useMessageInputContext<StreamChatGenerics>();

  return <MemoizedMicInput {...{ disabled, setShowVoiceUI, showVoiceUI }} {...props} />;
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
