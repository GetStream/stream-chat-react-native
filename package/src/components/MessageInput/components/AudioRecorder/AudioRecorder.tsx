import React, { useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import dayjs from 'dayjs';

import { Button } from '../../../../components/ui';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../../hooks/useStateStore';

import { ChevronLeft } from '../../../../icons/ChevronLeft';
import { Mic } from '../../../../icons/Mic';
import { Stop } from '../../../../icons/Stop';
import { Tick } from '../../../../icons/Tick';
import { Trash } from '../../../../icons/Trash';
import { IconProps } from '../../../../icons/utils/base';
import { NativeHandlers } from '../../../../native';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';

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
    theme: { semantics },
  } = useTheme();
  const onStopVoiceRecording = () => {
    NativeHandlers.triggerHaptic('impactMedium');
    stopVoiceRecordingHandler();
  };

  const StopIcon = useCallback(
    (props: IconProps) => <Stop {...props} fill={semantics.buttonDestructiveBg} />,
    [semantics.buttonDestructiveBg],
  );

  return (
    <Button
      variant='destructive'
      type='outline'
      size='sm'
      onPress={onStopVoiceRecording}
      LeadingIcon={StopIcon}
      iconOnly
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
    <Button
      variant='primary'
      type='solid'
      onPress={onUploadVoiceRecording}
      LeadingIcon={Tick}
      iconOnly
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
    <Button
      variant='secondary'
      type='outline'
      size='sm'
      iconOnly
      onPress={onDeleteVoiceRecording}
      LeadingIcon={Trash}
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
      semantics,
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
          <Mic height={20} width={20} stroke={semantics.accentError} {...micIcon} />
          <Text style={[styles.durationLabel]}>
            {duration ? dayjs.duration(duration).format('mm:ss') : '00:00'}
          </Text>
        </View>
        <Animated.View
          style={[styles.slideToCancelContainer, slideToCancelStyle, slideToCancelContainer]}
        >
          <Text style={[styles.slideToCancel, { color: semantics.textPrimary }]}>
            {t('Slide to Cancel')}
          </Text>
          <ChevronLeft stroke={semantics.textTertiary} height={20} width={20} {...arrowLeftIcon} />
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
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: primitives.spacingXs,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        checkContainer: {},
        deleteContainer: {},
        durationLabel: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
        },
        micContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingMd,
        },
        pausedContainer: {},
        slideToCancel: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
        },
        slideToCancelContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingXxs,
        },
      }),
    [semantics.textPrimary],
  );
};

AudioRecorder.displayName = 'AudioRecorder{messageInput}';
