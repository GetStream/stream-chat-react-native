import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';

import { ReactionPicker as ReactionPickerDefault } from './ReactionPicker';

import { emojiData as emojiDataDefault } from '../../utils/utils';

import type { LatestReactions, Reaction } from './ReactionList';
import type { ReactionPickerProps } from './ReactionPicker';

import type {
  Alignment,
  MessageWithDates,
} from '../../contexts/messagesContext/MessagesContext';
import type { Message } from '../../components/MessageList/utils/insertDates';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  offset: {
    left: 30,
    right: 10,
    top: 40,
  },
});

export type ReactionPickerWrapperProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  alignment: Alignment;
  customMessageContent: boolean;
  dismissReactionPicker: () => void;
  handleReaction: (id: Reaction['id']) => void;
  hideReactionCount: boolean;
  hideReactionOwners: boolean;
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  offset: { left: number; right: number; top: number };
  openReactionPicker: () => void;
  reactionPickerVisible: boolean;
  /**
   * e.g.,
   * [
   *  {
   *    id: 'like',
   *    icon: '👍',
   *  },
   *  {
   *    id: 'love',
   *    icon: '❤️️',
   *  },
   *  {
   *    id: 'haha',
   *    icon: '😂',
   *  },
   *  {
   *    id: 'wow',
   *    icon: '😮',
   *  },
   * ]
   */
  supportedReactions: Reaction[];
  /**
   * @deprecated
   * emojiData is deprecated. But going to keep it for now
   * to have backward compatibility. Please use supportedReactions instead.
   * TODO: Remove following prop in 1.x.x
   */
  emojiData?: Reaction[];
  ReactionPicker?: React.ComponentType<
    ReactionPickerProps<At, Ch, Co, Me, Re, Us>
  >;
};

export const ReactionPickerWrapper = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<
    ReactionPickerWrapperProps<At, Ch, Co, Ev, Me, Re, Us>
  >,
) => {
  const {
    alignment,
    children,
    customMessageContent,
    dismissReactionPicker,
    emojiData = emojiDataDefault,
    handleReaction,
    hideReactionCount = false,
    hideReactionOwners = false,
    message,
    offset = styles.offset,
    openReactionPicker,
    ReactionPicker = ReactionPickerDefault,
    reactionPickerVisible,
    supportedReactions = emojiDataDefault,
  } = props;

  const messageContainer = useRef<TouchableOpacity>(null);
  const [rpLeft, setRPLeft] = useState<number>();
  const [rpRight, setRPRight] = useState<number>();
  const [rpTop, setRPTop] = useState<number>();

  useEffect(() => {
    if (reactionPickerVisible) {
      setReactionPickerPosition();
    }
  }, [reactionPickerVisible]);

  const setReactionPickerPosition = () => {
    setTimeout(
      () => {
        if (messageContainer.current) {
          messageContainer.current.measureInWindow((x, y, width) => {
            setRPLeft(alignment === 'left' ? x - 10 + offset.left : undefined);
            setRPRight(
              alignment === 'right'
                ? Math.round(Dimensions.get('window').width) -
                    (x + width + offset.right)
                : undefined,
            );
            setRPTop(y - 60 + offset.top);
          });
        }
      },
      customMessageContent ? 10 : 0,
    );
  };

  return (
    <TouchableOpacity
      onPress={openReactionPicker}
      ref={messageContainer}
      testID='reaction-picker-wrapper'
    >
      {children}
      <ReactionPicker<At, Ch, Co, Me, Re, Us>
        {...props}
        handleDismiss={dismissReactionPicker}
        handleReaction={handleReaction}
        hideReactionCount={hideReactionCount}
        hideReactionOwners={hideReactionOwners}
        latestReactions={
          message.latest_reactions as LatestReactions<At, Ch, Co, Me, Re, Us>
        }
        reactionCounts={
          message.reaction_counts as MessageWithDates<
            At,
            Ch,
            Co,
            Me,
            Re,
            Us
          >['reaction_counts']
        }
        reactionPickerVisible={reactionPickerVisible}
        rpLeft={rpLeft}
        rpRight={rpRight}
        rpTop={rpTop}
        supportedReactions={supportedReactions || emojiData}
      />
    </TouchableOpacity>
  );
};
