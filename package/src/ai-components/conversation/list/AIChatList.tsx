import React, { type ReactNode, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe, useAnimatedStyle } from 'react-native-reanimated';

import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import type { LegendListRef, LegendListRenderItemProps } from '@legendapp/list/react-native';

import { useChatListController } from './useChatListController';
import { keyboardOverlapOf } from './useKeyboardOverlap';

import { useAITranslation, useTheme } from '../../contexts';
import { useAIIcons } from '../../icons';
import { useBottomSafeArea } from '../../internal/hooks/useBottomSafeArea';
import { primitives } from '../../internal/tokens';

export type AIChatListProps<T> = {
  /** The key of the row to pin to the top of what is visible, such as the latest question's. */
  anchorKey: string | undefined;
  data: T[];
  getItemType: (item: T) => string;
  keyExtractor: (item: T) => string;
  renderItem: (props: LegendListRenderItemProps<T>) => ReactNode;
  /** The room for a composer floating over the bottom of the list. */
  bottomInset?: number;
  /** What shows while there are no rows, centered. */
  emptyContent?: ReactNode;
  /**
   * How far above the bottom of the screen the composer sits, such as above a tab bar: the
   * keyboard covers the list only as far as it rises past that. Defaults to the bottom safe area.
   */
  keyboardOffset?: number;
  /** Loads the rows before the first one. `undefined` once there are none left. */
  loadOlderMessages?: () => Promise<void> | void;
  testID?: string;
};

const LoadingOlder = () => {
  const { t } = useAITranslation();
  const {
    theme: { colors, conversation },
  } = useTheme();
  return (
    <View
      accessibilityLabel={t('Loading older messages')}
      accessibilityRole='progressbar'
      accessible
      style={[styles.loadingOlder, conversation?.loadingOlder]}
    >
      <ActivityIndicator color={conversation?.loadingIndicator ?? colors.grey} />
    </View>
  );
};

const SCROLL_BUTTON_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.8 }] },
  100: { easing: Easing.inOut(Easing.ease), opacity: 1, transform: [{ scale: 1 }] },
}).duration(200);
const SCROLL_BUTTON_OUT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { easing: Easing.inOut(Easing.ease), opacity: 0, transform: [{ scale: 0.8 }] },
}).duration(200);

const ScrollToLatestButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, conversation },
  } = useTheme();
  const { ArrowDown } = useAIIcons();
  return (
    <Pressable
      accessibilityLabel={t('Scroll to latest')}
      accessibilityRole='button'
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.scrollButton,
        {
          backgroundColor: conversation?.scrollButtonBackground ?? colors.white,
          borderColor: conversation?.scrollButtonBorder ?? colors.grey_gainsboro,
          opacity: pressed ? 0.7 : 1,
        },
        conversation?.scrollButton,
      ]}
    >
      <ArrowDown color={conversation?.scrollButtonIcon ?? colors.black} size={20} />
    </Pressable>
  );
};

/**
 * The list of a chat with an agent: virtualised on Reanimated LegendList, reusing the views of
 * rows scrolled out of sight. It pins `anchorKey`'s row to the top of what is visible, opens at the
 * end, loads older rows as the person scrolls to the start, and offers a button back to the latest
 * row when the end is out of view. What the rows are is the caller's.
 */
export const AIChatList = <T,>({
  anchorKey,
  bottomInset = 0,
  data,
  emptyContent,
  getItemType,
  keyboardOffset: keyboardOffsetProp,
  keyExtractor,
  loadOlderMessages,
  renderItem,
  testID,
}: AIChatListProps<T>) => {
  const {
    theme: { conversation },
  } = useTheme();
  const listRef = useRef<LegendListRef>(null);
  const isEmpty = data.length === 0;
  const { isEndInView, keyboard, keyboardOffset, listProps, loadsOlder, scrollToEnd } =
    useChatListController({
      anchorKey,
      bottomInset,
      data,
      keyExtractor,
      listRef,
      loadOlderMessages: isEmpty ? undefined : loadOlderMessages,
    });

  const contentContainerStyle = useMemo(
    () =>
      StyleSheet.flatten([
        { paddingBottom: primitives.spacingMd + bottomInset },
        conversation?.content,
      ]),
    [bottomInset, conversation?.content],
  );

  const bottomSafeArea = useBottomSafeArea();
  const offset = keyboardOffsetProp ?? bottomSafeArea;
  keyboardOffset.current = offset;

  // The button rides the keyboard, so it stays in sight above it.
  const buttonLift = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOverlapOf(keyboard.value, offset) }],
  }));
  // What shows while there are no rows stays centered in what the keyboard leaves of the list.
  const emptyLift = useAnimatedStyle(() => ({
    paddingBottom: bottomInset + keyboardOverlapOf(keyboard.value, offset),
  }));

  return (
    <View style={[styles.container, conversation?.container]} testID={testID}>
      {/* Mounted even while there are no rows: the list follows the keyboard only from its next
          move, so one mounted while the keyboard is up would leave the first turn under it. The
          keyboard comes up over the list, which makes room for it below the latest turn: the room
          the pinned question leaves takes it first. */}
      <KeyboardAwareLegendList
        {...listProps}
        contentContainerStyle={contentContainerStyle}
        data={data}
        getItemType={getItemType}
        initialScrollAtEnd
        keyboardOffset={offset}
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListHeaderComponent={loadsOlder ? LoadingOlder : null}
        maintainVisibleContentPosition
        recycleItems
        ref={listRef}
        renderItem={renderItem}
        testID={testID && `${testID}-list`}
      />
      {isEmpty ? (
        <Animated.View
          pointerEvents='box-none'
          style={[styles.empty, emptyLift, conversation?.empty]}
          testID={testID && `${testID}-empty`}
        >
          {emptyContent}
        </Animated.View>
      ) : null}
      {!isEndInView && !isEmpty ? (
        <Animated.View
          pointerEvents='box-none'
          style={[
            styles.scrollButtonContainer,
            { bottom: bottomInset + primitives.spacingXs },
            buttonLift,
          ]}
        >
          <Animated.View entering={SCROLL_BUTTON_IN} exiting={SCROLL_BUTTON_OUT}>
            <ScrollToLatestButton onPress={scrollToEnd} />
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  loadingOlder: { alignItems: 'center', paddingTop: primitives.spacingMd },
  scrollButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    height: 40,
    justifyContent: 'center',
    // StreamChatAI's second elevation.
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    width: 40,
  },
  scrollButtonContainer: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
});
