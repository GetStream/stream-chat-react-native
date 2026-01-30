import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import dayjs from 'dayjs';

import { IconButton } from '../../../../components/ui';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../../hooks/useStateStore';

import { NewChevronLeft } from '../../../../icons/NewChevronLeft';
import { NewMic } from '../../../../icons/NewMic';
import { NewStop } from '../../../../icons/NewStop';
import { NewTick } from '../../../../icons/NewTick';
import { NewTrash } from '../../../../icons/NewTrash';
import { NativeHandlers } from '../../../../native';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';

type AudioRecorderPropsWithContext = Pick<
  MessageInputContextValue,
  | 'audioRecorderManager'
  | 'asyncMessagesMultiSendEnabled'
  | 'stopVoiceRecording'
  | 'deleteVoiceRecording'
  | 'uploadVoiceRecording'
> &
  Pick<AudioRecorderManagerState, 'duration' | 'micLocked' | 'status'> & {
    /**
     * Style used in slide to cancel container.
     */
    slideToCancelStyle?: StyleProp<ViewStyle>;
  };

const StopRecording = ({
  stopVoiceRecordingHandler,
}: {
  stopVoiceRecordingHandler: () => Promise<void>;
}) => {
  const {
    theme: {
      colors: { accent },
    },
  } = useTheme();

  const onStopVoiceRecording = () => {
    NativeHandlers.triggerHaptic('impactMedium');
    stopVoiceRecordingHandler();
  };

  return (
    <IconButton
      onPress={onStopVoiceRecording}
      Icon={NewStop}
      iconColor={accent.error}
      type='destructive'
      size='sm'
      category='outline'
    />
  );
};

const UploadRecording = ({
  asyncMessagesMultiSendEnabled,
  uploadVoiceRecordingHandler,
}: {
  asyncMessagesMultiSendEnabled: boolean;
  uploadVoiceRecordingHandler: (multiSendEnabled: boolean) => Promise<void>;
}) => {
  const onUploadVoiceRecording = () => {
    NativeHandlers.triggerHaptic('impactMedium');
    uploadVoiceRecordingHandler(asyncMessagesMultiSendEnabled);
  };

  return (
    <IconButton
      onPress={onUploadVoiceRecording}
      Icon={NewTick}
      iconColor='white'
      type='primary'
      size='sm'
    />
  );
};

const DeleteRecording = ({
  deleteVoiceRecordingHandler,
}: {
  deleteVoiceRecordingHandler: () => Promise<void>;
}) => {
  const onDeleteVoiceRecording = () => {
    NativeHandlers.triggerHaptic('impactMedium');
    deleteVoiceRecordingHandler();
  };
  return (
    <IconButton
      onPress={onDeleteVoiceRecording}
      Icon={NewTrash}
      type='secondary'
      category='outline'
      size='sm'
    />
  );
};

const AudioRecorderWithContext = (props: AudioRecorderPropsWithContext) => {
  const {
    asyncMessagesMultiSendEnabled,
    slideToCancelStyle,
    deleteVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
    micLocked,
    status,
    duration,
  } = props;
  const { t } = useTranslationContext();

  const recordingStopped = status === 'stopped';
  const {
    theme: {
      colors: { accent, grey_dark },
      messageInput: {
        audioRecorder: { arrowLeftIcon, micContainer, micIcon, slideToCancelContainer },
      },
    },
  } = useTheme();
  const styles = useStyles();

  if (micLocked) {
    if (recordingStopped) {
      return (
        <View style={styles.container}>
          <DeleteRecording deleteVoiceRecordingHandler={deleteVoiceRecording} />
          <UploadRecording
            asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
            uploadVoiceRecordingHandler={uploadVoiceRecording}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <DeleteRecording deleteVoiceRecordingHandler={deleteVoiceRecording} />
          <StopRecording stopVoiceRecordingHandler={stopVoiceRecording} />
          <UploadRecording
            asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
            uploadVoiceRecordingHandler={uploadVoiceRecording}
          />
        </View>
      );
    }
  } else {
    return (
      <>
        <View style={[styles.micContainer, micContainer]} testID='recording-active-container'>
          <NewMic height={20} width={20} stroke={accent.error} {...micIcon} />
          <Text style={[styles.durationLabel]}>
            {duration ? dayjs.duration(duration).format('mm:ss') : '00:00'}
          </Text>
        </View>
        <Animated.View
          style={[styles.slideToCancelContainer, slideToCancelStyle, slideToCancelContainer]}
        >
          <Text style={[styles.slideToCancel, { color: grey_dark }]}>{t('Slide to Cancel')}</Text>
          <NewChevronLeft stroke={grey_dark} height={20} width={20} {...arrowLeftIcon} />
        </Animated.View>
      </>
    );
  }
};

const MemoizedAudioRecorder = React.memo(
  AudioRecorderWithContext,
) as typeof AudioRecorderWithContext;

export type AudioRecorderProps = Partial<AudioRecorderPropsWithContext>;

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  duration: state.duration,
  micLocked: state.micLocked,
  status: state.status,
});

/**
 * Component to display the Recording UI in the Message Input.
 */
export const AudioRecorder = (props: AudioRecorderProps) => {
  const {
    audioRecorderManager,
    asyncMessagesMultiSendEnabled,
    stopVoiceRecording,
    deleteVoiceRecording,
    uploadVoiceRecording,
  } = useMessageInputContext();

  const { micLocked, duration, status } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );

  return (
    <MemoizedAudioRecorder
      {...{
        audioRecorderManager,
        asyncMessagesMultiSendEnabled,
        stopVoiceRecording,
        deleteVoiceRecording,
        uploadVoiceRecording,
        micLocked,
        status,
        duration,
      }}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: { colors, spacing, typography },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        checkContainer: {},
        deleteContainer: {},
        durationLabel: {
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.lineHeight.normal,
          color: colors.text.primary,
        },
        micContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        pausedContainer: {},
        slideToCancel: {
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.regular,
          lineHeight: typography.lineHeight.normal,
          color: colors.text.primary,
        },
        slideToCancelContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: spacing.xxs,
        },
      }),
    [colors, spacing, typography],
  );
};

AudioRecorder.displayName = 'AudioRecorder{messageInput}';
