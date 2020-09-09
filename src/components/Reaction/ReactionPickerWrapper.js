import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import ReactionPickerDefault from './ReactionPicker';

import { emojiData as emojiDataDefault } from '../../utils/utils';

const ReactionPickerWrapper = (props) => {
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

  const messageContainer = useRef();
  const [rpLeft, setRPLeft] = useState();
  const [rpRight, setRPRight] = useState();
  const [rpTop, setRPTop] = useState();

  useEffect(() => {
    if (reactionPickerVisible) {
      setReactionPickerPosition();
    }
  }, [reactionPickerVisible]);

  const setReactionPickerPosition = () => {
    if (messageContainer.current) {
      setTimeout(
        () => {
          messageContainer.current.measureInWindow((x, y, width) => {
            setRPLeft(alignment === 'left' ? x - 10 + offset.left : null);
            setRPRight(
              alignment === 'right'
                ? Math.round(Dimensions.get('window').width) -
                    (x + width + offset.right)
                : null,
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
      <ReactionPicker
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

ReactionPickerWrapper.propTypes = {
  alignment: PropTypes.oneOf(['left', 'right']),
  /**
   * Whether or not the app is using a custom MessageContent component
   */
  customMessageContent: PropTypes.bool,
  dismissReactionPicker: PropTypes.func,
  /**
   * @deprecated
   * emojiData is deprecated. But going to keep it for now
   * to have backward compatibility. Please use supportedReactions instead.
   * TODO: Remove following prop in 1.x.x
   */
  emojiData: PropTypes.array,
  handleReaction: PropTypes.func,
  hideReactionCount: PropTypes.bool,
  hideReactionOwners: PropTypes.bool,
  message: PropTypes.object,
  offset: PropTypes.object,
  openReactionPicker: PropTypes.func,
  ReactionPicker: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  reactionPickerVisible: PropTypes.bool,
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
  supportedReactions: PropTypes.array,
};

export default ReactionPickerWrapper;
