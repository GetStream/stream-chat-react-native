import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

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
import type { DefaultStreamChatGenerics } from '../../../../types/types';
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

export type ReactionListBottomItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessageContextValue<StreamChatGenerics>,
    | 'handleReaction'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'showMessageOverlay'
  >
> &
  Partial<Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'>> & {
    reaction: ReactionSummary;
  };

export const ReactionListBottomItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReactionListBottomItemProps<StreamChatGenerics>,
) => {
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
      colors: { black, grey_gainsboro, light_blue },
      messageSimple: {
        reactionListBottom: {
          item: { container, countText, icon, iconFillColor, iconSize, iconUnFillColor },
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
                showMessageOverlay(true);
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
            backgroundColor: reaction.own ? light_blue : grey_gainsboro,
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

export type ReactionListBottomProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessageContextValue<StreamChatGenerics>,
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
  Partial<Pick<MessagesContextValue<StreamChatGenerics>, 'supportedReactions'>>;

export const ReactionListBottom = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReactionListBottomProps<StreamChatGenerics>,
) => {
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
  } = useMessageContext<StreamChatGenerics>();

  const { supportedReactions: contextSupportedReactions } =
    useMessagesContext<StreamChatGenerics>();

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
        reactionListBottom: { container },
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

  return (
    <View accessibilityLabel='Reaction List Bottom' style={[styles.container, container]}>
      {reactions.map((reaction, index) => (
        <ReactionListBottomItem
          key={index}
          {...{
            handleReaction,
            onLongPress,
            onPress,
            onPressIn,
            preventPress,
            reaction,
            showMessageOverlay,
            supportedReactions,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
