import React, { type ReactNode, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { LegendListRef, LegendListRenderItemProps } from '@legendapp/list/react-native';
import { AnimatedLegendList } from '@legendapp/list/reanimated';

import { useChatListController } from './useChatListController';

import { useAITranslation, useTheme } from '../../contexts';
import { useAIIcons } from '../../icons';
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
  const { contentFloor, isEndInView, listProps, loadsOlder, onContainerLayout, scrollToEnd } =
    useChatListController({
      anchorKey,
      bottomInset,
      data,
      keyExtractor,
      listRef,
      loadOlderMessages: isEmpty ? undefined : loadOlderMessages,
    });

  // Flattened: the list reads the floor from it.
  const contentContainerStyle = useMemo(
    () =>
      StyleSheet.flatten([
        { minHeight: contentFloor, paddingBottom: primitives.spacingMd + bottomInset },
        conversation?.content,
      ]),
    [bottomInset, contentFloor, conversation?.content],
  );

  return (
    <View
      onLayout={onContainerLayout}
      style={[styles.container, conversation?.container]}
      testID={testID}
    >
      {isEmpty ? (
        <View
          style={[styles.empty, { paddingBottom: bottomInset }, conversation?.empty]}
          testID={testID && `${testID}-empty`}
        >
          {emptyContent}
        </View>
      ) : (
        <AnimatedLegendList
          {...listProps}
          contentContainerStyle={contentContainerStyle}
          data={data}
          getItemType={getItemType}
          initialScrollAtEnd
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps='handled'
          ListHeaderComponent={loadsOlder ? LoadingOlder : null}
          maintainVisibleContentPosition
          recycleItems
          ref={listRef}
          renderItem={renderItem}
          testID={testID && `${testID}-list`}
        />
      )}
      {!isEndInView && !isEmpty ? (
        <View
          pointerEvents='box-none'
          style={[styles.scrollButtonContainer, { bottom: bottomInset + 8 }]}
        >
          <ScrollToLatestButton onPress={scrollToEnd} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
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
