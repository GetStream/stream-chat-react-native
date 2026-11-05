import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '../voice-visualization/useReduceMotion';

/**
 * Spaces out the parts of a reply's UI that come in together, so they come in one after another
 * rather than at once. The counterpart of `AIUICascade` in StreamChatAI.
 */
export class AIUICascade {
  /** How long after the part before it a part comes in, in seconds. */
  static readonly step = 0.1;
  /** The longest a part waits for the parts before it, in seconds. */
  static readonly longestWait = 0.4;

  private next = 0;

  /** How long a part that comes in at `now`, in seconds, waits for the parts before it. */
  delay(now = (typeof performance === 'undefined' ? Date.now() : performance.now()) / 1000) {
    const start = Math.min(Math.max(now, this.next), now + AIUICascade.longestWait);
    this.next = start + AIUICascade.step;
    return start - now;
  }
}

type AIUIStage = {
  cascade: AIUICascade;
  /** Whether what shows now comes in with the part around it, rather than on its own. */
  isCarried: boolean;
};

const AIUIStageContext = createContext<AIUIStage | undefined>(undefined);

// StreamChatAI's spring: response 0.7, damping 0.88. It settles in about as long.
const SPRING = { dampingRatio: 0.88, duration: 700 };
// With reduced motion a part only fades, which the system setting would otherwise skip.
const FADE = {
  duration: 300,
  easing: Easing.out(Easing.ease),
  reduceMotion: ReduceMotion.Never,
};
// How far a part rises into place, and how small it starts.
const RISE = 16;
const START_SCALE = 0.97;

// Shows its content, bringing it in after the cascade's delay when it starts hidden.
const useEntrance = (startsHidden: boolean, cascade: AIUICascade | undefined) => {
  const reduceMotion = useReduceMotion();
  const [hasShown, setHasShown] = useState(!startsHidden);
  const progress = useSharedValue(startsHidden ? 0 : 1);
  useEffect(() => {
    if (hasShown) return;
    const delay = (cascade?.delay() ?? 0) * 1000;
    progress.value = withDelay(delay, reduceMotion ? withTiming(1, FADE) : withSpring(1, SPRING));
    setHasShown(true);
  }, [cascade, hasShown, progress, reduceMotion]);
  const style = useAnimatedStyle(() => {
    const shown = Math.min(progress.value, 1);
    if (reduceMotion) return { opacity: shown };
    return {
      opacity: shown,
      transform: [
        { translateY: (1 - progress.value) * RISE },
        { scale: START_SCALE + (1 - START_SCALE) * progress.value },
      ],
    };
  }, [reduceMotion]);
  return { hasShown, style };
};

/**
 * A reply's generated UI as a whole: it comes in when it first shows while the agent writes it,
 * and shows at once when it was written before, such as a reply from history.
 */
export const AIUIEntranceStage = ({
  children,
  isStreaming,
  style,
}: {
  children: ReactNode;
  /** Whether the agent is writing the UI as it first shows. */
  isStreaming: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const [cascade] = useState(() => new AIUICascade());
  // UI written before it showed shows whole, its parts with it.
  const [isLive] = useState(isStreaming);
  const { hasShown, style: entrance } = useEntrance(isStreaming, cascade);
  const stage = useMemo(
    () => ({ cascade, isCarried: !isLive || !hasShown }),
    [cascade, hasShown, isLive],
  );
  return (
    <AIUIStageContext.Provider value={stage}>
      <Animated.View style={[styles.entrance, entrance, style]}>{children}</Animated.View>
    </AIUIStageContext.Provider>
  );
};

/**
 * What a part of a reply's generated UI needs to come in when it shows, for a renderer that
 * animates a view of its own rather than wrap the part in `AIUIEntrance`: the animated `style`
 * for that view, and `scope`, to wrap what the part shows in, so what shows with it comes in
 * with it. The same entrance as `AIUIEntrance`'s.
 */
export const useAIUIEntrance = () => {
  const stage = useContext(AIUIStageContext);
  const { hasShown, style } = useEntrance(!!stage && !stage.isCarried, stage?.cascade);
  const inner = useMemo(
    () => stage && { cascade: stage.cascade, isCarried: stage.isCarried || !hasShown },
    [hasShown, stage],
  );
  const scope = useMemo(
    () => (children: ReactNode) => (
      <AIUIStageContext.Provider value={inner}>{children}</AIUIStageContext.Provider>
    ),
    [inner],
  );
  return { scope, style: [styles.entrance, style] };
};

/**
 * Brings a part of a reply's generated UI in when it shows, such as when the agent writes it:
 * the part fades in, rising into place, after the parts that came in just before it. What shows
 * together with the reply's UI, or with a part around it, comes in with that, so a reply written
 * before it showed shows at once. With reduced motion it only fades.
 *
 * Renderers give it to each part they place. Every app component has it.
 */
export const AIUIEntrance = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const { scope, style: entrance } = useAIUIEntrance();
  return <Animated.View style={[entrance, style]}>{scope(children)}</Animated.View>;
};

const styles = StyleSheet.create({
  entrance: { transformOrigin: 'top' },
});
