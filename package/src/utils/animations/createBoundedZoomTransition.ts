import {
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
  withTiming,
} from 'react-native-reanimated';

export type BoundedZoomDirection = 'bottom' | 'left' | 'right' | 'top';

type CreateBoundedZoomTransitionParams = {
  duration: number;
};

const getInitialOffset = (direction: BoundedZoomDirection, values: EntryAnimationsValues) => {
  'worklet';

  switch (direction) {
    case 'bottom':
      return { translateX: 0, translateY: values.targetHeight };
    case 'left':
      return { translateX: -values.targetWidth, translateY: 0 };
    case 'right':
      return { translateX: values.targetWidth, translateY: 0 };
    case 'top':
      return { translateX: 0, translateY: -values.targetHeight };
    default:
      return { translateX: 0, translateY: 0 };
  }
};

const getTargetOffset = (direction: BoundedZoomDirection, values: ExitAnimationsValues) => {
  'worklet';

  switch (direction) {
    case 'bottom':
      return { translateX: 0, translateY: values.currentHeight };
    case 'left':
      return { translateX: -values.currentWidth, translateY: 0 };
    case 'right':
      return { translateX: values.currentWidth, translateY: 0 };
    case 'top':
      return { translateX: 0, translateY: -values.currentHeight };
    default:
      return { translateX: 0, translateY: 0 };
  }
};

export const createBoundedZoomTransition = ({ duration }: CreateBoundedZoomTransitionParams) => {
  const createBoundedZoomIn =
    (direction: BoundedZoomDirection) =>
    (values: EntryAnimationsValues): LayoutAnimation => {
      'worklet';

      const initialOffset = getInitialOffset(direction, values);

      return {
        animations: {
          transform: [
            { translateX: withTiming(0, { duration }) },
            { translateY: withTiming(0, { duration }) },
            { scale: withTiming(1, { duration }) },
          ],
        },
        initialValues: {
          transform: [
            { translateX: initialOffset.translateX },
            { translateY: initialOffset.translateY },
            { scale: 0 },
          ],
        },
      };
    };

  const createBoundedZoomOut =
    (direction: BoundedZoomDirection) =>
    (values: ExitAnimationsValues): LayoutAnimation => {
      'worklet';

      const targetOffset = getTargetOffset(direction, values);

      return {
        animations: {
          transform: [
            {
              translateX: withTiming(targetOffset.translateX, {
                duration,
              }),
            },
            {
              translateY: withTiming(targetOffset.translateY, {
                duration,
              }),
            },
            { scale: withTiming(0, { duration }) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
        },
      };
    };

  return {
    boundedZoomIn: {
      bottom: createBoundedZoomIn('bottom'),
      left: createBoundedZoomIn('left'),
      right: createBoundedZoomIn('right'),
      top: createBoundedZoomIn('top'),
    },
    boundedZoomOut: {
      bottom: createBoundedZoomOut('bottom'),
      left: createBoundedZoomOut('left'),
      right: createBoundedZoomOut('right'),
      top: createBoundedZoomOut('top'),
    },
  } as const;
};
