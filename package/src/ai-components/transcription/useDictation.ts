import { useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { useStateStore } from '@stream-io/state-store/react-bindings';

import { useStableCallback } from '../internal/hooks/useStableCallback';
import { AIDictation } from '../native/AIDictation';
import type { DictationResult, DictationStartOptions } from '../native-specs/NativeAIDictation';
import { dictationStore, type DictationStoreState } from '../store';

const DEFAULT_OPTIONS = {
  language: 'en-US',
  interimResults: true,
  silenceTimeoutMs: 2500,
};

const ensureAndroidRecordingPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

// TODO: add proper jsdocs
export type UseDictationOptions = {
  /**
   * Who is dictating, stored as the dictation store's `source` when dictation starts. The
   * `ComposerView` only fills its input with dictation whose source is the composer's own, so
   * dictation started elsewhere (a voice mode, say) leaves the composer's text alone.
   */
  source?: string;
};

export const useDictation = (
  defaultOptions: DictationStartOptions = DEFAULT_OPTIONS,
  { source }: UseDictationOptions = {},
) => {
  const { isRecording } = useStateStore(dictationStore, selector);

  useEffect(() => {
    const unsubscribeResult = AIDictation.addResultListener((result: DictationResult) => {
      dictationStore.partialNext({
        transcript: result.text,
        ...(result.isFinal ? { isRecording: false, state: 'idle' } : {}),
      });
    });

    const unsubscribeState = AIDictation.addStateListener(({ state: next }) => {
      dictationStore.partialNext({
        state: next,
        isRecording: next === 'listening' || next === 'starting',
      });
    });

    const unsubscribeError = AIDictation.addErrorListener((error) => {
      dictationStore.partialNext({ error, isRecording: false, state: 'idle' });
    });

    return () => {
      unsubscribeResult();
      unsubscribeState();
      unsubscribeError();
    };
  }, []);

  const start = useCallback(
    async (override?: DictationStartOptions) => {
      const hasPermission = await ensureAndroidRecordingPermissions();
      if (!hasPermission) {
        dictationStore.partialNext({
          error: {
            code: 'NO_PERMISSION',
            message: 'Microphone permission not granted',
          },
          source: source ?? null,
        });
        return;
      }

      dictationStore.partialNext({ error: null, source: source ?? null, transcript: '' });

      const opts: DictationStartOptions = {
        ...defaultOptions,
        ...override,
      };

      AIDictation.start(opts);
    },
    [defaultOptions, source],
  );

  const stop = useCallback(() => {
    AIDictation.stop();
  }, []);

  const cancel = useCallback(() => {
    AIDictation.cancel();
  }, []);

  const toggle = useStableCallback(() => {
    if (isRecording) {
      stop();
    } else {
      void start();
    }
  });

  return {
    start,
    stop,
    toggle,
    cancel,
  };
};
