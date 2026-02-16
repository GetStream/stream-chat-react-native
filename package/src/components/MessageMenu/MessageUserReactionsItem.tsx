import React, { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMessageContext } from '../../contexts';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { Unknown } from '../../icons';

import { primitives } from '../../theme';
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
      colors: { accent_blue, black, grey, grey_gainsboro, light_blue },
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
  const styles = useStyles();

  const { client } = useChatContext();
  const isOwnReaction = client.userID === id;

  const { handleReaction } = useMessageContext();

  const onPress = useStableCallback(() => {
    if (isOwnReaction && handleReaction) {
      handleReaction(type);
    }
  });

  const Icon = supportedReactions.find((reaction) => reaction.type === type)?.Icon ?? Unknown;

  return (
    <Pressable
      accessibilityLabel='Individual User Reaction on long press message'
      accessibilityRole='button'
      style={[styles.avatarContainer, avatarContainer]}
      onPress={onPress}
    >
      <MessageUserReactionsAvatar reaction={reaction} size={'lg'} />
      <View style={[styles.avatarNameContainer, avatarNameContainer]}>
        <Text numberOfLines={1} style={[styles.avatarName, avatarName]}>
          {name}
        </Text>
        {isOwnReaction ? (
          <Text numberOfLines={1} style={[styles.avatarSubtitle, null]}>
            Tap to remove
          </Text>
        ) : null}
      </View>
      <Icon size={24} />
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        avatarContainer: {
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          paddingVertical: primitives.spacingXs,
          paddingHorizontal: primitives.spacingSm,
        },
        avatarInnerContainer: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarName: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textPrimary,
          textAlign: 'left',
        },
        avatarSubtitle: {
          fontSize: primitives.typographyFontSizeSm,
          color: semantics.textTertiary,
        },
        avatarNameContainer: {
          flex: 1,
          paddingHorizontal: 8,
          justifyContent: 'center',
          textAlign: 'center',
        },
        reactionBubbleBackground: {
          alignItems: 'center',
          borderRadius: 24,
          height: 24,
          justifyContent: 'center',
          width: 24,
        },
      }),
    [semantics.textPrimary],
  );
};
