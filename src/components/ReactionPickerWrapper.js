import React from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';

import { ReactionPicker } from './ReactionPicker';

export class ReactionPickerWrapper extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { reactionPickerVisible: false };
  }
  _setReactionPickerPosition = () => {
    const { isMyMessage, message, offset } = this.props;
    const pos = isMyMessage(message) ? 'right' : 'left';
    this.messageContainer.measureInWindow((x, y, width) => {
      this.setState({
        reactionPickerVisible: true,
        rpTop: y - 60 + offset.top,
        rpLeft: pos === 'left' ? x - 10 + offset.left : null,
        rpRight:
          pos === 'right'
            ? Math.round(Dimensions.get('window').width) - (x + width + 10)
            : null,
      });
    });
  };

  openReactionSelector = () => {
    // Keyboard closes automatically whenever modal is opened (currently there is no way of avoiding this afaik)
    // So we need to postpone the calculation for reaction picker position
    // until after keyboard is closed completely. To achieve this, we close
    // the keyboard forcefully and then calculate position of picker in callback.
    this._setReactionPickerPosition();
  };

  render() {
    const { handleReaction, message, emojiData, style } = this.props;
    return (
      <TouchableOpacity
        onPress={this.openReactionSelector}
        ref={(o) => (this.messageContainer = o)}
      >
        {this.props.children}
        <ReactionPicker
          reactionPickerVisible={this.state.reactionPickerVisible}
          handleReaction={handleReaction}
          hideReactionOwners={true}
          latestReactions={message.latest_reactions}
          reactionCounts={message.reaction_counts}
          handleDismiss={() => {
            this.setState({ reactionPickerVisible: false });
          }}
          style={style}
          emojiData={emojiData}
          rpLeft={this.state.rpLeft}
          rpRight={this.state.rpRight}
          rpTop={this.state.rpTop}
        />
      </TouchableOpacity>
    );
  }
}
