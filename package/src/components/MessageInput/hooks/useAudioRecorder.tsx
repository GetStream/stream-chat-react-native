import { useCallback, useEffect, useState } from 'react';

import { LocalVoiceRecordingAttachment } from 'stream-chat';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';

import { MessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import type { File } from '../../../types/types';
import { FileTypes } from '../../../types/types';
import { generateRandomId } from '../../../utils/utils';
import { resampleWaveformData } from '../utils/audioSampling';

/**
 * The hook that controls all the async audio core features including start/stop or recording, player, upload/delete of the recorded audio.
 *
 * FIXME: Change the name to `useAudioRecorder` in the next major version as the hook will only be used for audio recording.
 */
export const useAudioRecorder = ({
  audioRecorderManager,
  sendMessage,
}: Pick<MessageInputContextValue, 'audioRecorderManager' | 'sendMessage'>) => {
  const [isScheduledForSubmit, setIsScheduleForSubmit] = useState(false);
  const { attachmentManager } = useMessageComposer();

  /**
   * A function that takes care of stopping the voice recording from the library's
   * side only. Meant to be used as a pure function (during unmounting for instance)
   * hence this approach.
   */
  const stopVoiceRecording = useCallback(
    async (withDelete?: boolean) => {
      await audioRecorderManager.stopRecording(withDelete);
    },
    [audioRecorderManager],
  );

  // This effect stop the player from playing and stops audio recording on
  // the audio SDK side on unmount.
  useEffect(
    () => () => {
      stopVoiceRecording();
    },
    [stopVoiceRecording],
  );

  useEffect(() => {
    if (isScheduledForSubmit) {
      sendMessage();
      setIsScheduleForSubmit(false);
    }
  }, [isScheduledForSubmit, sendMessage]);

  /**
   * Function to start voice recording. Will return whether access is granted
   * with regards to the microphone permission as that's how the underlying
   * library works on iOS.
   */
  const startVoiceRecording = useCallback(async () => {
    return await audioRecorderManager.startRecording();
  }, [audioRecorderManager]);

  /**
   * Function to delete voice recording.
   */
  const deleteVoiceRecording = useCallback(async () => {
    await stopVoiceRecording(true);
  }, [stopVoiceRecording]);

  /**
   * Function to upload or send voice recording.
   * @param multiSendEnabled boolean
   */
  const uploadVoiceRecording = useCallback(
    async (multiSendEnabled: boolean) => {
      try {
        const { recording, duration, waveformData } = audioRecorderManager.state.getLatestValue();
        await stopVoiceRecording();

        const durationInSeconds = parseFloat((duration / 1000).toFixed(3));

        const resampledWaveformData =
          waveformData.length > 100 ? resampleWaveformData(waveformData, 100) : waveformData;

        const clearFilter = new RegExp('[.:]', 'g');
        const date = new Date().toISOString().replace(clearFilter, '_');

        const file: File = {
          duration: durationInSeconds,
          name: `audio_recording_${date}.aac`,
          size: 0,
          type: 'audio/aac',
          uri:
            typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string),
          waveform_data: resampledWaveformData,
        };

        const audioFile: LocalVoiceRecordingAttachment = {
          asset_url:
            typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string),
          duration: durationInSeconds,
          file_size: 0,
          localMetadata: {
            file,
            id: generateRandomId(),
            uploadState: 'pending',
          },
          mime_type: 'audio/aac',
          title: `audio_recording_${date}.aac`,
          type: FileTypes.VoiceRecording,
          waveform_data: resampledWaveformData,
        };

        audioRecorderManager.reset();

        if (multiSendEnabled) {
          await attachmentManager.uploadAttachment(audioFile);
        } else {
          // FIXME: cannot call handleSubmit() directly as the function has stale reference to file uploads
          await attachmentManager.uploadAttachment(audioFile);
          setIsScheduleForSubmit(true);
        }
      } catch (error) {
        console.log('Error uploading voice recording: ', error);
      }
    },
    [audioRecorderManager, attachmentManager, stopVoiceRecording],
  );

  return {
    deleteVoiceRecording,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
  };
};
