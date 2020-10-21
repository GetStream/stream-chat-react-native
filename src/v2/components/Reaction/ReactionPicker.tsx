import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '../Avatar/Avatar';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { emojiData } from '../../utils/utils';

import type { LatestReactions, Reaction } from './ReactionList';

import type { MessageWithDates } from '../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
    marginTop: -5,
  },
  container: {
    flex: 1,
  },
  containerView: {
    backgroundColor: '#000000',
    borderRadius: 30,
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 20,
    marginVertical: 5,
  },
  reactionCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reactionOwners: { height: 18, width: 18 },
});

const getLatestUser = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  type: string,
  reactions?: LatestReactions<At, Ch, Co, Me, Re, Us>,
) => {
  const filtered = reactions?.filter((item) => item.type === type);
  if (filtered?.[0]?.user) {
    return filtered[0].user;
  }
  return;
};

export type ReactionPickerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  handleDismiss: () => void;
  handleReaction: (arg: string) => void;
  hideReactionCount: boolean;
  hideReactionOwners: boolean;
  latestReactions?: LatestReactions<At, Ch, Co, Me, Re, Us>;
  reactionCounts?:
    | MessageWithDates<At, Ch, Co, Me, Re, Us>['reaction_counts']
    | null;
  reactionPickerVisible?: boolean;
  rpLeft?: number;
  rpRight?: number;
  rpTop?: number;
  supportedReactions?: Reaction[];
};

// TODO: change from using Modal to reanimated view to save on rendering and performance
export const ReactionPicker = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: ReactionPickerProps<At, Ch, Co, Me, Re, Us>,
) => {
  const {
    handleDismiss,
    handleReaction,
    hideReactionCount = false,
    hideReactionOwners = false,
    latestReactions,
    reactionCounts,
    reactionPickerVisible,
    rpLeft,
    rpRight,
    rpTop = 40,
    supportedReactions = emojiData,
  } = props;

  const {
    theme: {
      message: {
        reactionPicker: { column, container, containerView, emoji, text },
      },
    },
  } = useTheme();

  if (!reactionPickerVisible) return null;

  return (
    <Modal
      animationType='fade'
      onRequestClose={handleDismiss}
      testID='reaction-picker'
      transparent
      visible
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDismiss}
        style={[
          styles.container,
          { alignItems: rpLeft ? 'flex-start' : 'flex-end' },
          container,
        ]}
      >
        <View
          style={[
            styles.containerView,
            {
              marginLeft: rpLeft,
              marginRight: rpRight,
              marginTop: rpTop,
            },
            containerView,
          ]}
        >
          {supportedReactions.map(({ icon, id }) => {
            const count = reactionCounts?.[id] || 0;
            const latestUser = getLatestUser(id, latestReactions);

            return (
              <View key={id} style={[styles.column, column]} testID={id}>
                {latestUser && !hideReactionOwners ? (
                  <Avatar
                    image={latestUser.image}
                    name={latestUser.name || latestUser.id}
                    size={18}
                  />
                ) : (
                  !hideReactionOwners && <View style={styles.reactionOwners} />
                )}
                <Text
                  onPress={() => handleReaction(id)}
                  style={[styles.emoji, emoji]}
                  testID={`${id}-reaction`}
                >
                  {icon}
                </Text>
                {!hideReactionCount && (
                  <Text
                    style={[styles.reactionCount, text]}
                    testID={`${id}-${count || 'count'}`}
                  >
                    {count > 0 ? count : ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

ReactionPicker.displayName = 'ReactionPicker{message{reactionPicker}}';
