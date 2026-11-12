import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
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
 * rather than at once.
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

// A spring with a response of 0.7 and a damping of 0.88. It settles in about as long.
const SPRING = { dampingRatio: 0.88, duration: 700 };
// With reduced motion a part only fades, which the system setting would otherwise skip.
const FADE = {
  duration: 300,
  easing: Easing.out(Easing.ease),
  reduceMotion: ReduceMotion.Never,
};
// How far a part rises into place, how small it starts, and how far out of focus.
const RISE = 16;
const START_SCALE = 0.97;
const START_BLUR = 8;
// A blur only Android 12 and later draws; elsewhere a part comes in without it.
const CAN_BLUR = Platform.OS === 'android' && Number(Platform.Version) >= 31;

// Shows its content, bringing it in after the cascade's delay when it starts hidden.
const useEntrance = (
  startsHidden: boolean,
  cascade: AIUICascade | undefined,
  resetKey?: unknown,
) => {
  const reduceMotion = useReduceMotion();
  const [shownFor, setShownFor] = useState(resetKey);
  const [hasShownState, setHasShown] = useState(!startsHidden);
  const isReset = !Object.is(shownFor, resetKey);
  if (isReset) {
    setShownFor(resetKey);
    setHasShown(!startsHidden);
  }
  const hasShown = isReset ? !startsHidden : hasShownState;
  const progress = useSharedValue(startsHidden ? 0 : 1);
  const progressFor = useRef(resetKey);
  useLayoutEffect(() => {
    if (Object.is(progressFor.current, resetKey)) return;
    progressFor.current = resetKey;
    progress.value = startsHidden ? 0 : 1;
  });
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
      // Back in focus as it settles: a blur this small draws nothing.
      ...(CAN_BLUR ? { filter: [{ blur: Math.max(0, 1 - shown) * START_BLUR }] } : {}),
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
  resetKey,
  style,
}: {
  children: ReactNode;
  /** Whether the agent is writing the UI as it first shows. */
  isStreaming: boolean;
  /**
   * Which reply's UI it shows: when it changes, it shows the UI as one mounted for it would, as
   * when a list reuses it for another reply.
   */
  resetKey?: unknown;
  style?: StyleProp<ViewStyle>;
}) => {
  const [held, setHeld] = useState(() => ({
    cascade: new AIUICascade(),
    isLive: isStreaming,
    resetKey,
  }));
  let shown = held;
  if (!Object.is(held.resetKey, resetKey)) {
    shown = { cascade: new AIUICascade(), isLive: isStreaming, resetKey };
    setHeld(shown);
  }
  const { cascade, isLive } = shown;
  const { hasShown, style: entrance } = useEntrance(isLive, cascade, resetKey);
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
 * Whether a part of a reply's generated UI comes in, as it was when the part first showed: a
 * part that shows at once, such as one of a reply from history, can show in a plain view. A part
 * mounted before it has anything to show passes `shows` as false until it does.
 */
export const useAIUIComesIn = (shows = true) => {
  const stage = useContext(AIUIStageContext);
  const [comesIn, setComesIn] = useState<boolean | undefined>(() =>
    shows ? !!stage && !stage.isCarried : undefined,
  );
  if (comesIn !== undefined || !shows) return comesIn ?? false;
  const now = !!stage && !stage.isCarried;
  setComesIn(now);
  return now;
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
 * the part fades in, rising into place and, on Android 12 and later, coming into focus, after the
 * parts that came in just before it. What shows together with the reply's UI, or with a part
 * around it, comes in with that, so a reply written before it showed shows at once. With reduced
 * motion it only fades.
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
  const comesIn = useAIUIComesIn();
  return comesIn ? (
    <EnteringPart style={style}>{children}</EnteringPart>
  ) : (
    <View style={[styles.entrance, style]}>{children}</View>
  );
};

const EnteringPart = ({
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
