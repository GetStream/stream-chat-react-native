import React, {
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  type GestureType,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useBottomSheetState } from './hooks/useBottomSheetState';
import { closeSheet as closeSheetInternal } from '../store/bottom-sheet-state-store';

type Props = PropsWithChildren;

const { height: SCREEN_H } = Dimensions.get('window');
const SPRING = { duration: 200 };
const MAX_BOTTOM_SHEET_HEIGHT = Math.round(SCREEN_H * 0.4);
const BACKDROP_OPACITY = 0.4;

export function BottomSheet({ children }: Props) {
  const { open, height } = useBottomSheetState();
  const [bottomSheetModalOpen, setBottomSheetModalOpen] = useState(open);
  const maxTranslateY = SCREEN_H;
  const translateY = useSharedValue(maxTranslateY);

  const bottomSheetHeight = useMemo(
    () => Math.min(height, MAX_BOTTOM_SHEET_HEIGHT),
    [height],
  );
  const bottomSheetY = SCREEN_H - bottomSheetHeight;

  useEffect(() => {
    if (open) {
      setBottomSheetModalOpen(true);
    } else {
      translateY.value = withTiming(maxTranslateY, SPRING, (finished) => {
        if (finished) {
          runOnJS(setBottomSheetModalOpen)(false);
        }
      });
    }
  }, [setBottomSheetModalOpen, maxTranslateY, open, translateY]);

  useEffect(() => {
    if (bottomSheetModalOpen && open) {
      translateY.value = withTiming(bottomSheetY, SPRING);
    }
  }, [open, bottomSheetModalOpen, bottomSheetY, translateY]);

  const dragStartY = useRef(0);
  const panRef = useRef<GestureType | undefined>(undefined);
  const scrollRef = useRef<GestureType | undefined>(undefined);

  const nativeScroll = useMemo(() => Gesture.Native().withRef(scrollRef), []);

  const pan = Gesture.Pan()
    .withRef(panRef)
    .requireExternalGestureToFail(scrollRef)
    .onBegin(() => {
      dragStartY.current = 0;
    })
    .onUpdate((e) => {
      if (dragStartY.current === 0) dragStartY.current = translateY.value;
      const next = dragStartY.current + e.translationY;
      const minY = bottomSheetY;
      const maxY = maxTranslateY;
      const overTop = next < minY;
      const overBottom = next > maxY;
      translateY.value = overTop
        ? minY - (minY - next) * 0.2
        : overBottom
          ? maxY + (next - maxY) * 0.2
          : next;
    })
    .onEnd((e) => {
      // very basic momentum bias
      const projected = e.translationY + e.velocityY * 0.15;
      const nearest =
        projected >= bottomSheetHeight * 0.5 ? maxTranslateY : bottomSheetY;
      translateY.value = withTiming(nearest, SPRING, (finished) => {
        if (finished && nearest === maxTranslateY)
          runOnJS(closeSheetInternal)();
      });
    });

  const backdropStyle = useAnimatedStyle(() => {
    const minY = bottomSheetY;
    const t =
      1 -
      Math.min(
        1,
        Math.max(0, (translateY.value - minY) / (maxTranslateY - minY)),
      );
    return {
      opacity: t * BACKDROP_OPACITY,
      pointerEvents: t > 0.02 ? 'auto' : ('none' as any),
    };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const sheetContentStyle = useMemo(
    () => ({ height: bottomSheetHeight }),
    [bottomSheetHeight],
  );

  return (
    <Modal visible={bottomSheetModalOpen} transparent={true}>
      <GestureHandlerRootView style={styles.gestureHandlerRootView}>
        <View style={StyleSheet.absoluteFill} pointerEvents={'box-none'}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeSheetInternal}
            />
          </Animated.View>

          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.sheet, sheetStyle]}>
              <View style={styles.handleContainer} pointerEvents={'none'}>
                <View style={styles.handle} />
              </View>

              <View style={[styles.content, sheetContentStyle]}>
                <View style={styles.contentContainer}>
                  {open ? (
                    <GestureDetector gesture={nativeScroll}>
                      {children}
                    </GestureDetector>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureHandlerRootView: { flex: 1 },
  backdrop: { backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    overflow: 'hidden',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_H,
    transform: [{ translateY: SCREEN_H }],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 12,
      },
      android: { elevation: 18 },
    }),
  },
  handleContainer: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444' },
  content: { flexGrow: 0 },
  contentContainer: { flex: 1, minHeight: 0 },
});
