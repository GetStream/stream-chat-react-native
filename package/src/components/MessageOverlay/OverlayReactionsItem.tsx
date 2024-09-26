import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { ReactionResponse } from 'stream-chat';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Unknown } from '../../icons';

import type { DefaultStreamChatGenerics, Reaction } from '../../types/types';
import { ReactionData } from '../../utils/utils';

export type OverlayReactionsItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessagesContextValue<StreamChatGenerics>, 'OverlayReactionsAvatar'> & {
  /**
   * The reaction object
   */
  reaction: Reaction;
  /**
   * An array of supported reactions
   */
  supportedReactions: ReactionData[];
};

type ReactionIconProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ReactionResponse<StreamChatGenerics>, 'type'> & {
  /**
   * The fill color for the reaction icon
   */
  pathFill: string;
  /**
   * The size of the reaction icon
   */
  size: number;
  /**
   * An array of supported reactions
   */
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
      colors: { accent_blue, black, grey, grey_gainsboro, white },
      overlay: {
        reactions: {
          avatarContainer,
          avatarName,
          avatarSize,
          radius,
          reactionBubbleBackground,
          reactionBubbleBorderRadius,
        },
      },
    },
  } = useTheme();
  const { client } = useChatContext();
  const alignment = client.userID && client.userID === id ? 'left' : 'right';
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
        <View
          style={[
            styles.reactionBubbleBackground,
            {
              backgroundColor: grey_gainsboro,
              borderColor: alignment === 'left' ? white : grey_gainsboro,
              borderWidth: radius / 2,
              left,
              top,
            },
            reactionBubbleBackground,
          ]}
        >
          <ReactionIcon
            pathFill={alignment === 'left' ? accent_blue : grey}
            size={(reactionBubbleBorderRadius || styles.reactionBubbleBackground.borderRadius) / 2}
            supportedReactions={supportedReactions}
            type={type}
          />
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
    marginBottom: 8,
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
  reactionBubbleBackground: {
    alignItems: 'center',
    borderRadius: 24,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    width: 24,
  },
});
