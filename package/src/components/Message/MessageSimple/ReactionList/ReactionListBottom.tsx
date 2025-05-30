import React, { useCallback, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

import { Unknown } from '../../../../icons/Unknown';

import type { IconProps } from '../../../../icons/utils/base';

import type { ReactionData } from '../../../../utils/utils';
import { ReactionSummary } from '../../hooks/useProcessReactions';

type Props = Pick<IconProps, 'pathFill' | 'style'> & {
  size: number;
  type: string;
  supportedReactions?: ReactionData[];
};

const Icon = ({ pathFill, size, style, supportedReactions, type }: Props) => {
  const ReactionIcon =
    supportedReactions?.find((reaction) => reaction.type === type)?.Icon || Unknown;

  return <ReactionIcon height={size} pathFill={pathFill} style={style} width={size} />;
};

export type ReactionListBottomItemProps = Partial<
  Pick<
    MessageContextValue,
    | 'handleReaction'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'showMessageOverlay'
  >
> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>> & {
    reaction: ReactionSummary;
  };

export const ReactionListBottomItem = (props: ReactionListBottomItemProps) => {
  const {
    handleReaction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    reaction,
    showMessageOverlay,
    supportedReactions,
  } = props;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const {
    theme: {
      colors: { black },
      messageSimple: {
        reactionListBottom: {
          item: {
            container,
            countText,
            filledBackgroundColor,
            icon,
            iconFillColor,
            iconSize,
            iconUnFillColor,
            unfilledBackgroundColor,
          },
        },
      },
    },
  } = useTheme();

  const onPressInAnimation = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  }, [scaleValue]);

  const onPressOutAnimation = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleValue]);

  return (
    <Pressable
      accessibilityLabel='Reaction List Bottom Item'
      disabled={preventPress}
      key={reaction.type}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            defaultHandler: () => {
              if (showMessageOverlay) {
                showMessageOverlay(true, reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: () => {
              if (handleReaction) {
                handleReaction(reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        onPressInAnimation();
        if (onPressIn) {
          onPressIn({
            defaultHandler: () => {
              if (handleReaction) {
                handleReaction(reaction.type);
              }
            },
            emitter: 'reactionList',
            event,
          });
        }
      }}
      onPressOut={onPressOutAnimation}
    >
      <Animated.View
        style={[
          styles.itemContainer,
          {
            backgroundColor: reaction.own ? filledBackgroundColor : unfilledBackgroundColor,
            transform: [{ scale: scaleValue }],
          },
          container,
        ]}
      >
        <Icon
          key={reaction.type}
          pathFill={reaction.own ? iconFillColor : iconUnFillColor}
          size={iconSize}
          style={icon}
          supportedReactions={supportedReactions}
          type={reaction.type}
        />
        <Text style={[styles.reactionCount, { color: black }, countText]}>{reaction.count}</Text>
      </Animated.View>
    </Pressable>
  );
};

const renderItem = ({ index, item }: { index: number; item: ReactionListBottomItemProps }) => (
  <ReactionListBottomItem
    handleReaction={item.handleReaction}
    key={index}
    onLongPress={item.onLongPress}
    onPress={item.onPress}
    onPressIn={item.onPressIn}
    preventPress={item.preventPress}
    reaction={item.reaction}
    showMessageOverlay={item.showMessageOverlay}
    supportedReactions={item.supportedReactions}
  />
);

export type ReactionListBottomProps = Partial<
  Pick<
    MessageContextValue,
    | 'handleReaction'
    | 'hasReactions'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'reactions'
    | 'showMessageOverlay'
  >
> &
  Partial<Pick<MessagesContextValue, 'supportedReactions'>>;

export const ReactionListBottom = (props: ReactionListBottomProps) => {
  const {
    handleReaction: propHandlerReaction,
    hasReactions: propHasReactions,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    reactions: propReactions,
    showMessageOverlay: propShowMessageOverlay,
    supportedReactions: propSupportedReactions,
  } = props;

  const {
    handleReaction: contextHandleReaction,
    hasReactions: contextHasReactions,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    reactions: contextReactions,
    showMessageOverlay: contextShowMessageOverlay,
  } = useMessageContext();

  const { supportedReactions: contextSupportedReactions } = useMessagesContext();

  const handleReaction = propHandlerReaction || contextHandleReaction;
  const hasReactions = propHasReactions || contextHasReactions;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPress = propOnPress || contextOnPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const preventPress = propPreventPress || contextPreventPress;
  const reactions = propReactions || contextReactions;
  const showMessageOverlay = propShowMessageOverlay || contextShowMessageOverlay;
  const supportedReactions = propSupportedReactions || contextSupportedReactions;
  const {
    theme: {
      messageSimple: {
        reactionListBottom: { contentContainer },
      },
    },
  } = useTheme();

  const supportedReactionTypes = supportedReactions?.map(
    (supportedReaction) => supportedReaction.type,
  );

  const hasSupportedReactions = reactions.some((reaction) =>
    supportedReactionTypes?.includes(reaction.type),
  );

  if (!hasSupportedReactions || !hasReactions) {
    return null;
  }

  const reactionListBottomItemData: ReactionListBottomItemProps[] = reactions.map((reaction) => ({
    handleReaction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    reaction,
    showMessageOverlay,
    supportedReactions,
  }));

  return (
    <FlatList
      accessibilityLabel='Reaction List Bottom'
      contentContainerStyle={[styles.contentContainer, contentContainer]}
      data={reactionListBottomItemData}
      keyExtractor={(item) => item.reaction.type}
      numColumns={6}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignSelf: 'flex-end',
  },
  itemContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 2,
    padding: 8,
  },
  reactionCount: {
    fontWeight: '600',
    marginLeft: 4,
  },
});
