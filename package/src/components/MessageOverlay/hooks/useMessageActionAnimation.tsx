import type { ViewStyle } from 'react-native';
import type { TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { MessageActionListItemProps } from '../MessageActionListItem';

export const useMessageActionAnimation = ({
  action,
}: Pick<MessageActionListItemProps, 'action'>) => {
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
        opacity.value = 0.2;
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
