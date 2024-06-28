import React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ReactionResponse } from 'stream-chat';

import { Reaction } from './OverlayReactions';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import type { MessageOverlayContextValue } from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Unknown } from '../../icons';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ReactionData } from '../../utils/utils';

export type OverlayReactionsItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageOverlayContextValue<StreamChatGenerics>, 'OverlayReactionsAvatar'> & {
  reaction: Reaction;
  supportedReactions: ReactionData[];
};

type ReactionIconProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ReactionResponse<StreamChatGenerics>, 'type'> & {
  pathFill: string;
  size: number;
  supportedReactions: ReactionData[];
};

const ReactionIcon = ({ pathFill, size, supportedReactions, type }: ReactionIconProps) => {
  const Icon = supportedReactions.find((reaction) => reaction.type === type)?.Icon || Unknown;
  return <Icon height={size} pathFill={pathFill} width={size} />;
};

export const OverlayReactionsItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  OverlayReactionsAvatar,
  reaction,
  supportedReactions,
}: OverlayReactionsItemProps<StreamChatGenerics>) => {
  const { id, name, type } = reaction;
  const {
    theme: {
      colors: { accent_blue, black, grey_gainsboro, white },
      overlay: {
        reactions: {
          avatarContainer,
          avatarName,
          avatarSize,
          radius,
          reactionBubble,
          reactionBubbleBackground,
          reactionBubbleBorderRadius,
        },
      },
    },
  } = useTheme();
  const { client } = useChatContext();
  const alignment = client.userID && client.userID === id ? 'right' : 'left';
  const x = avatarSize / 2 - (avatarSize / (radius * 4)) * (alignment === 'left' ? 1 : -1);
  const y = avatarSize - radius;

  const left =
    alignment === 'left'
      ? x -
        (Number(reactionBubbleBackground.width || 0) || styles.reactionBubbleBackground.width) +
        radius
      : x - radius;
  const top =
    y -
    radius -
    (Number(reactionBubbleBackground.height || 0) || styles.reactionBubbleBackground.height);

  return (
    <View style={[styles.avatarContainer, avatarContainer]}>
      <View style={styles.avatarInnerContainer}>
        <OverlayReactionsAvatar reaction={reaction} size={avatarSize} />
        <View style={[StyleSheet.absoluteFill]}>
          <Svg>
            <Circle
              cx={x - (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)}
              cy={y - radius * 2 - radius / 4}
              fill={alignment === 'left' ? grey_gainsboro : white}
              r={radius * 2}
              stroke={alignment === 'left' ? white : grey_gainsboro}
              strokeWidth={radius / 2}
            />
            <Circle
              cx={x}
              cy={y}
              fill={alignment === 'left' ? grey_gainsboro : white}
              r={radius}
              stroke={alignment === 'left' ? white : grey_gainsboro}
              strokeWidth={radius / 2}
            />
          </Svg>
          <View
            style={[
              styles.reactionBubbleBackground,
              {
                backgroundColor: alignment === 'left' ? grey_gainsboro : white,
                borderColor: alignment === 'left' ? white : grey_gainsboro,
                borderWidth: radius / 2,
                left,
                top,
              },
              reactionBubbleBackground,
            ]}
          />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={x - (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)}
                cy={y - radius * 2 - radius / 4}
                fill={alignment === 'left' ? grey_gainsboro : white}
                r={radius * 2 - radius / 2}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.reactionBubble,
              {
                backgroundColor: alignment === 'left' ? grey_gainsboro : white,
                height:
                  (reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) - radius / 2,
                left,
                top,
                width:
                  (reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) - radius / 2,
              },
              reactionBubble,
            ]}
          >
            <ReactionIcon
              pathFill={accent_blue}
              size={(reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) / 2}
              supportedReactions={supportedReactions}
              type={type}
            />
          </View>
        </View>
      </View>
      <View style={styles.avatarNameContainer}>
        <Text numberOfLines={2} style={[styles.avatarName, { color: black }, avatarName]}>
          {name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    padding: 8,
  },
  avatarInnerContainer: {
    alignSelf: 'center',
  },
  avatarName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    paddingTop: 6,
    textAlign: 'center',
  },
  avatarNameContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
  },
  reactionBubble: {
    alignItems: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    position: 'absolute',
  },
  reactionBubbleBackground: {
    borderRadius: 24,
    height: 24,
    position: 'absolute',
    width: 24,
  },
});
