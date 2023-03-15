import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mic } from '../../icons/Mic';
import { SendPlane } from '../../icons/SendPlane';
import { Stop } from '../../icons/Stop';

import { Audio, AudioReturnType } from '../../native';
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
  const [recording, setRecording] = useState<AudioReturnType | undefined>(undefined);
  const { disabled, handleOnPress } = props;

  const {
    theme: {
      colors: { accent_blue, accent_red },
      messageInput: { commandsButton },
    },
  } = useTheme();

  const startRecording = async () => {
    const recording = await Audio.startRecording();
    setRecording(recording);
  };

  const stopRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.stopRecording();
      const uri = await recording.getURI();
      const status = await recording.getStatusAsync();
      console.log('Recording URI', uri, status);
    }
  };

  return (
    <View style={styles.container}>
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
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

MicInput.displayName = 'MicInput{messageInput}';
