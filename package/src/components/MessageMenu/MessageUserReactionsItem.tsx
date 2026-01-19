import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Unknown } from '../../icons';

import type { Reaction } from '../../types/types';
import { ReactionData } from '../../utils/utils';

export type MessageUserReactionsItemProps = Pick<
  MessagesContextValue,
  'MessageUserReactionsAvatar'
> & {
  /**
   * The reaction object
   */
  reaction: Reaction;
  /**
   * An array of supported reactions
   */
  supportedReactions: ReactionData[];
};

export const MessageUserReactionsItem = ({
  MessageUserReactionsAvatar,
  reaction,
  supportedReactions,
}: MessageUserReactionsItemProps) => {
  const { id, name, type } = reaction;
  const {
    theme: {
      colors: { accent_blue, black, grey, grey_gainsboro, light_blue, white },
      messageMenu: {
        userReactions: {
          avatarContainer,
          avatarInnerContainer,
          avatarName,
          avatarNameContainer,
          filledBackgroundColor = light_blue,
          iconFilledColor = accent_blue,
          iconUnFilledColor = grey,
          radius,
          reactionBubbleBackground,
          reactionBubbleBorderRadius,
          unfilledBackgroundColor = grey_gainsboro,
        },
      },
    },
  } = useTheme();
  const { client } = useChatContext();
  const alignment = client.userID && client.userID === id ? 'left' : 'right';

  const Icon = supportedReactions.find((reaction) => reaction.type === type)?.Icon ?? Unknown;

  return (
    <View
      accessibilityLabel='Individual User Reaction on long press message'
      style={[styles.avatarContainer, avatarContainer]}
    >
      <View style={[styles.avatarInnerContainer, avatarInnerContainer]}>
        <MessageUserReactionsAvatar reaction={reaction} size={'lg'} />
        <View
          style={[
            styles.reactionBubbleBackground,
            {
              backgroundColor:
                alignment === 'left' ? filledBackgroundColor : unfilledBackgroundColor,
              borderColor: alignment === 'left' ? white : grey_gainsboro,
              borderWidth: radius / 2,
              bottom: 0,
              left: 0,
            },
            reactionBubbleBackground,
          ]}
        >
          <Icon
            height={reactionBubbleBorderRadius / 2}
            pathFill={alignment === 'left' ? iconFilledColor : iconUnFilledColor}
            width={reactionBubbleBorderRadius / 2}
          />
        </View>
      </View>
      <View style={[styles.avatarNameContainer, avatarNameContainer]}>
        <Text numberOfLines={2} style={[styles.avatarName, { color: black }, avatarName]}>
          {name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    marginBottom: 24,
    marginHorizontal: 8,
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
