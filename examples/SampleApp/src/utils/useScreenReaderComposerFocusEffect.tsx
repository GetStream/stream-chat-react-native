import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';

import { ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSetAccessibilityFocus } from 'stream-chat-react-native';

/**
 * Lands the screen-reader cursor on the message composer input when this screen
 * is entered, without opening the keyboard or activating the field (the user
 * still double taps to type).
 *
 * Complements the SDK's builtin focus on mount (`useScreenReaderMountFocus` in
 * MessageComposer), which lands Android forward navigation. This handles the
 * cases mount can't: back navigation on both platforms and some iOS quirks,
 * by firing on the native stack `transitionEnd` event, once the screen is the
 * settled, active accessibility layer (a focus set mid transition on iOS races the
 * OS's own focus pass and is dropped). `transitionEnd` fires on push and pop reveal.
 */
export const useScreenReaderComposerFocusEffect = () => {
  const inputRef = useRef<TextInput | null>(null);
  const setAccessibilityFocus = useSetAccessibilityFocus();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const setInputRef = useCallback((ref: TextInput | null) => {
    inputRef.current = ref;
  }, []);

  useFocusEffect(
    useCallback(
      () =>
        navigation.addListener('transitionEnd', (e) => {
          if (!e.data.closing) {
            setAccessibilityFocus(inputRef);
          }
        }),
      [navigation, setAccessibilityFocus],
    ),
  );

  return { setInputRef };
};
