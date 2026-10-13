import { useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { AIDictation } from '../native/AIDictation';
import type {
  DictationResult,
  DictationStartOptions,
} from '../native-specs/NativeAIDictation';
import { useStableCallback } from '../internal/hooks/useStableCallback';
import { dictationStore, type DictationStoreState } from '../store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

const DEFAULT_OPTIONS = {
  language: 'en-US',
  interimResults: true,
  silenceTimeoutMs: 2500,
};

const ensureAndroidRecordingPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

// TODO: add proper jsdocs
export const useDictation = (
  defaultOptions: DictationStartOptions = DEFAULT_OPTIONS,
) => {
  const { isRecording } = useStateStore(dictationStore, selector);

  useEffect(() => {
    const unsubscribeResult = AIDictation.addResultListener(
      (result: DictationResult) => {
        dictationStore.partialNext({
          transcript: result.text,
          ...(result.isFinal ? { isRecording: false, state: 'idle' } : {}),
        });
      },
    );

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
        });
        return;
      }

      dictationStore.partialNext({ error: null, transcript: '' });

      const opts: DictationStartOptions = {
        ...defaultOptions,
        ...override,
      };

      AIDictation.start(opts);
    },
    [defaultOptions],
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
