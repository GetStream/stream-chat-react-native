import { useEffect } from 'react';
import { AppState, type EventSubscription, Keyboard, Platform } from 'react-native';

import { useMessageInputContext } from '../contexts/messageInputContext/MessageInputContext';

/**
 * @internal
 *
 * Focuses the message input each time `focusFor` changes to a value, so the keyboard opens.
 *
 * On Android a sheet that is still closing can hold window focus, and the keyboard opens only for
 * a focused window. So there it focuses again once the app window gets focus back.
 * */
export const useFocusMessageInput = (focusFor: string | undefined) => {
  const { inputBoxRef } = useMessageInputContext();

  useEffect(() => {
    if (!focusFor) return;
    inputBoxRef.current?.focus();
    if (Platform.OS !== 'android') return;

    const subscriptions: EventSubscription[] = [];
    const stopWaiting = () => subscriptions.forEach((subscription) => subscription.remove());
    subscriptions.push(
      AppState.addEventListener('focus', () => {
        stopWaiting();
        // React Native skips `focus()` on the input it already considers focused.
        inputBoxRef.current?.blur();
        inputBoxRef.current?.focus();
      }),
      Keyboard.addListener('keyboardDidShow', stopWaiting),
    );
    return stopWaiting;
  }, [focusFor, inputBoxRef]);
};
