import React from 'react';
import PropTypes from 'prop-types';

import { Dimensions, TouchableOpacity } from 'react-native';

import ReactionPicker from './ReactionPicker';
import { emojiData } from '../../utils';

class ReactionPickerWrapper extends React.PureComponent {
  static propTypes = {
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
    isMyMessage: PropTypes.func,
    message: PropTypes.object,
    offset: PropTypes.object,
    openReactionPicker: PropTypes.func,
    ReactionPicker: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
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
    style: PropTypes.any,
    supportedReactions: PropTypes.array,
  };

  static defaultProps = {
    emojiData,
    hideReactionCount: false,
    hideReactionOwners: false,
    offset: {
      left: 30,
      right: 10,
      top: 40,
    },
    ReactionPicker,
    supportedReactions: emojiData,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.reactionPickerVisible) this._setReactionPickerPosition();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.reactionPickerVisible && this.props.reactionPickerVisible) {
      this._setReactionPickerPosition();
    }
  }

  _setReactionPickerPosition = () => {
    const { alignment, offset } = this.props;
    if (this.messageContainer) {
      this.messageContainer.measureInWindow((x, y, width) => {
        this.setState({
          rpLeft: alignment === 'left' ? x - 10 + offset.left : null,
          rpRight:
            alignment === 'right'
              ? Math.round(Dimensions.get('window').width) -
                (x + width + offset.right)
              : null,
          rpTop: y - 60 + offset.top,
        });
      });
    }
  };

  render() {
    const {
      handleReaction,
      message,
      supportedReactions,
      /** @deprecated */
      emojiData,
      style,
      dismissReactionPicker,
      reactionPickerVisible,
      ReactionPicker,
      openReactionPicker,
      hideReactionCount,
      hideReactionOwners,
    } = this.props;
    return (
      <TouchableOpacity
        onPress={() => {
          openReactionPicker();
        }}
        ref={(o) => (this.messageContainer = o)}
      >
        {this.props.children}
        <ReactionPicker
          {...this.props}
          handleDismiss={dismissReactionPicker}
          handleReaction={handleReaction}
          hideReactionCount={hideReactionCount}
          hideReactionOwners={hideReactionOwners}
          latestReactions={message.latest_reactions}
          reactionCounts={message.reaction_counts}
          reactionPickerVisible={reactionPickerVisible}
          rpLeft={this.state.rpLeft}
          rpRight={this.state.rpRight}
          rpTop={this.state.rpTop}
          style={style}
          supportedReactions={supportedReactions || emojiData}
        />
      </TouchableOpacity>
    );
  }
}

export default ReactionPickerWrapper;
