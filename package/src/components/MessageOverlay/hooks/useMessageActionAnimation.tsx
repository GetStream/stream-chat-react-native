import type { ViewStyle } from 'react-native';
import { TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { MessageActionListItemProps } from '../MessageActionListItem';

/**
 * @deprecated
 * The implementation is done in the component itself using new API of `react-native-gesture-handler`.
 */
export const useMessageActionAnimation = ({
  action,
  activeOpacity = 0.2,
}: Pick<MessageActionListItemProps, 'action'> & {
  activeOpacity?: number;
}) => {
  const opacity = useSharedValue(1);

  const onTap = useAnimatedGestureHandler<TapGestureHandlerStateChangeEvent>(
    {
      onEnd: () => {
        runOnJS(action)();
      },
      onFinish: () => {
        opacity.value = 1;
      },
      onStart: () => {
        opacity.value = activeOpacity;
      },
    },
    [action],
  );

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    onTap,
    opacity,
  };
};
