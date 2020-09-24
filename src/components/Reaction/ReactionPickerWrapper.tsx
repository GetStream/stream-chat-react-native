import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';

import ReactionPickerDefault from './ReactionPicker';

import type { Reaction } from './ReactionList';
import type { ReactionPickerProps } from './ReactionPicker';

import { emojiData as emojiDataDefault } from '../../utils/utils';

import type {
  Alignment,
  MessageWithDates,
} from '../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

type Props<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  alignment: Alignment;
  customMessageContent: boolean;
  dismissReactionPicker: () => void;
  /**
   * @deprecated
   * emojiData is deprecated. But going to keep it for now
   * to have backward compatibility. Please use supportedReactions instead.
   * TODO: Remove following prop in 1.x.x
   */
  emojiData: Reaction[];
  handleReaction: (id: Reaction['id']) => void;
  hideReactionCount: boolean;
  hideReactionOwners: boolean;
  message: MessageWithDates<At, Ch, Co, Me, Re, Us>;
  offset: { left: number; right: number; top: number };
  openReactionPicker: () => void;
  ReactionPicker: React.ComponentType<
    Partial<ReactionPickerProps<At, Ch, Co, Me, Re, Us>>
  >;
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
};

const ReactionPickerWrapper = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>(
  props: PropsWithChildren<Props<At, Ch, Co, Me, Re, Us>>,
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
    offset = { left: 30, right: 10, top: 40 },
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
    if (messageContainer.current) {
      setTimeout(
        () => {
          messageContainer?.current?.measureInWindow((x, y, width) => {
            setRPLeft(alignment === 'left' ? x - 10 + offset.left : undefined);
            setRPRight(
              alignment === 'right'
                ? Math.round(Dimensions.get('window').width) -
                    (x + width + offset.right)
                : undefined,
            );
            setRPTop(y - 60 + offset.top);
          });
        },
        customMessageContent ? 10 : 0,
      );
    }
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
        latestReactions={message.latest_reactions}
        reactionCounts={message.reaction_counts}
        reactionPickerVisible={reactionPickerVisible}
        rpLeft={rpLeft}
        rpRight={rpRight}
        rpTop={rpTop}
        supportedReactions={supportedReactions || emojiData}
      />
    </TouchableOpacity>
  );
};

export default ReactionPickerWrapper;
