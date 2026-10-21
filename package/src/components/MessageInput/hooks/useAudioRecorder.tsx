import { useCallback, useEffect } from 'react';

import { LocalVoiceRecordingAttachment } from 'stream-chat';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';

import { MessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import type { File } from '../../../types/types';
import { FileTypes } from '../../../types/types';
import { generateRandomId } from '../../../utils/utils';
import { resampleWaveformData } from '../utils/audioSampling';

/**
 * Controls voice recording: start, stop, delete, and upload or send of the recorded audio.
 *
 * @param params.audioRecorderManager Manager that owns the recording state.
 * @param params.sendMessage Sends the message when a recording is sent on completion.
 * @returns `deleteVoiceRecording`, `startVoiceRecording`, `stopVoiceRecording` and
 * `uploadVoiceRecording`.
 */
export const useAudioRecorder = ({
  audioRecorderManager,
  sendMessage,
}: Pick<MessageInputContextValue, 'audioRecorderManager' | 'sendMessage'>) => {
  const { attachmentManager } = useMessageComposer();

  // Stops the recording on the library side only, so it is safe to call on unmount.
  const stopVoiceRecording = useCallback(
    async (withDelete?: boolean) => {
      await audioRecorderManager.stopRecording(withDelete);
    },
    [audioRecorderManager],
  );

  // Stops the recording on the audio SDK side on unmount.
  useEffect(
    () => () => {
      stopVoiceRecording();
    },
    [stopVoiceRecording],
  );

  // Resolves to whether microphone access is granted, as the underlying library reports on iOS.
  const startVoiceRecording = useCallback(async () => {
    return await audioRecorderManager.startRecording();
  }, [audioRecorderManager]);

  const deleteVoiceRecording = useCallback(async () => {
    await stopVoiceRecording(true);
  }, [stopVoiceRecording]);

  // Sends the message with the recording when `sendOnComplete` is true, otherwise only uploads it.
  const uploadVoiceRecording = useCallback(
    async (sendOnComplete: boolean) => {
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
          custom: {
            duration: durationInSeconds,
            file_size: 0,
            mime_type: 'audio/aac',
            waveform_data: resampledWaveformData,
          },
          localMetadata: {
            file,
            id: generateRandomId(),
            uploadState: 'pending',
          },
          title: `audio_recording_${date}.aac`,
          type: FileTypes.VoiceRecording,
        };

        audioRecorderManager.reset();

        if (sendOnComplete) {
          attachmentManager.upsertAttachments([audioFile]);
          sendMessage();
        } else {
          await attachmentManager.uploadAttachment(audioFile);
        }
      } catch (error) {
        console.log('Error uploading voice recording: ', error);
      }
    },
    [audioRecorderManager, attachmentManager, sendMessage, stopVoiceRecording],
  );

  return {
    deleteVoiceRecording,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
  };
};
