import { useCallback, useEffect, useState } from 'react';

import { LocalAttachment } from 'stream-chat';

import { AudioConfig } from '../../../types/types';

/**
 * Manages the state of audio attachments for preview and playback.
 * @param files The audio files to manage.
 * @returns An object containing the state and handlers for audio attachments.
 */
export const useAudioPreviewManager = (files: LocalAttachment[]) => {
  const [audioAttachmentsStateMap, setAudioAttachmentsStateMap] = useState<
    Record<string, AudioConfig>
  >({});

  useEffect(() => {
    setAudioAttachmentsStateMap((prevState) => {
      const updatedStateMap = Object.fromEntries(
        files.map((attachment) => {
          const id = attachment.localMetadata.id;

          const config: AudioConfig = {
            duration: attachment.duration ?? prevState[id]?.duration ?? 0,
            paused: prevState[id]?.paused ?? true,
            progress: prevState[id]?.progress ?? 0,
          };

          return [id, config];
        }),
      );

      return updatedStateMap;
    });
  }, [files]);

  // Handler triggered when an audio is loaded in the message input. The initial state is defined for the audio here
  // and the duration is set.
  const onLoad = useCallback((index: string, duration: number) => {
    setAudioAttachmentsStateMap((prevState) => ({
      ...prevState,
      [index]: {
        ...prevState[index],
        duration,
      },
    }));
  }, []);

  // The handler which is triggered when the audio progresses/ the thumb is dragged in the progress control. The
  // progressed duration is set here.
  const onProgress = useCallback((index: string, progress: number) => {
    setAudioAttachmentsStateMap((prevState) => ({
      ...prevState,
      [index]: {
        ...prevState[index],
        progress,
      },
    }));
  }, []);

  // The handler which controls or sets the paused/played state of the audio.
  const onPlayPause = useCallback((index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // In this case, all others except the index are set to paused.
      setAudioAttachmentsStateMap((prevState) => {
        const newState = { ...prevState };
        Object.keys(newState).forEach((key) => {
          if (key !== index) {
            newState[key].paused = true;
          }
        });
        return {
          ...newState,
          [index]: {
            ...newState[index],
            paused: false,
          },
        };
      });
    } else {
      setAudioAttachmentsStateMap((prevState) => ({
        ...prevState,
        [index]: {
          ...prevState[index],
          paused: true,
        },
      }));
    }
  }, []);

  return {
    audioAttachmentsStateMap,
    onLoad,
    onPlayPause,
    onProgress,
    setAudioAttachmentsStateMap,
  };
};
