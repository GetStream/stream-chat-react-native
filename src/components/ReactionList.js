import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { emojiData } from '../utils';

export class ReactionList extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  _renderReactions = (reactions) => {
    const reactionsByType = {};
    reactions.map((item) => {
      if (reactions[item.type] === undefined) {
        return (reactionsByType[item.type] = [item]);
      } else {
        return (reactionsByType[item.type] = [
          ...reactionsByType[item.type],
          item,
        ]);
      }
    });

    const emojiDataByType = {};
    emojiData.forEach((e) => (emojiDataByType[e.id] = e));

    const reactionTypes = emojiData.map((e) => e.id);
    return Object.keys(reactionsByType).map((type) =>
      reactionTypes.indexOf(type) > -1 ? (
        <Text key={type}>{emojiDataByType[type].icon}</Text>
      ) : null,
    );
  };

  _getReactionCount = (reactionCounts) => {
    let count = null;
    if (
      reactionCounts !== null &&
      reactionCounts !== undefined &&
      Object.keys(reactionCounts).length > 0
    ) {
      count = 0;
      Object.keys(reactionCounts).map((key) => (count += reactionCounts[key]));
    }
    return count;
  };

  render() {
    const {
      latestReactions,
      openReactionSelector,
      reactionCounts,
      visible,
    } = this.props;
    return (
      <TouchableOpacity onPress={openReactionSelector} activeOpacity={1}>
        <View
          style={{
            opacity: visible ? 1 : 0,
            display: 'flex',
            flexDirection: 'row',
            padding: 5,
            backgroundColor: 'black',
            borderRadius: 10,
          }}
        >
          {this._renderReactions(latestReactions)}
          <Text
            style={{
              color: 'white',
              paddingLeft: 5,
              paddingRight: 5,
            }}
          >
            {this._getReactionCount(reactionCounts)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}
