import { FadeIn, FadeOut, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';

export const transitions = {
  fadeIn200: FadeIn.duration(200),
  fadeOut200: FadeOut.duration(200),
  layout200: LinearTransition.duration(200),
  zoomIn200: ZoomIn.duration(200),
  zoomOut200: ZoomOut.duration(200),
} as const;
