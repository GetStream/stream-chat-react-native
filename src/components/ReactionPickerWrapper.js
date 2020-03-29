import React from 'react';
import PropTypes from 'prop-types';

import { TouchableOpacity, Dimensions } from 'react-native';

import { ReactionPicker } from './ReactionPicker';
import { emojiData } from '../utils';

export class ReactionPickerWrapper extends React.PureComponent {
  static propTypes = {
    isMyMessage: PropTypes.func,
    message: PropTypes.object,
    offset: PropTypes.object,
    hideReactionCount: PropTypes.bool,
    hideReactionOwners: PropTypes.bool,
    handleReaction: PropTypes.func,
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
    /**
     * @deprecated
     * emojiData is deprecated. But going to keep it for now
     * to have backward compatibility. Please use supportedReactions instead.
     * TODO: Remove following prop in 1.x.x
     */
    emojiData: PropTypes.array,
    ReactionPicker: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    dismissReactionPicker: PropTypes.func,
    reactionPickerVisible: PropTypes.bool,
    openReactionPicker: PropTypes.func,
    style: PropTypes.any,
  };

  static defaultProps = {
    offset: {
      top: 40,
      left: 30,
      right: 10,
    },
    ReactionPicker,
    supportedReactions: emojiData,
    emojiData,
    hideReactionCount: false,
    hideReactionOwners: false,
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
    this.messageContainer.measureInWindow((x, y, width) => {
      this.setState({
        rpTop: y - 60 + offset.top,
        rpLeft: alignment === 'left' ? x - 10 + offset.left : null,
        rpRight:
          alignment === 'right'
            ? Math.round(Dimensions.get('window').width) -
              (x + width + offset.right)
            : null,
      });
    });
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
          reactionPickerVisible={reactionPickerVisible}
          handleReaction={handleReaction}
          latestReactions={message.latest_reactions}
          reactionCounts={message.reaction_counts}
          handleDismiss={dismissReactionPicker}
          hideReactionCount={hideReactionCount}
          hideReactionOwners={hideReactionOwners}
          style={style}
          supportedReactions={supportedReactions || emojiData}
          rpLeft={this.state.rpLeft}
          rpRight={this.state.rpRight}
          rpTop={this.state.rpTop}
        />
      </TouchableOpacity>
    );
  }
}
