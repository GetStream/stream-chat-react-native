import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styled from '@stream-io/styled-components';
import { emojiData } from '../utils';

const Container = styled.View`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: black;
    theme.reactionList.container.backgroundColor};
  padding: 5px;
  border-radius: 100;
  ${({ theme }) => theme.reactionList.container.extra}
`;

const ReactionCount = styled.Text`
  color: white;
  padding-left: 5px;
  padding-right: 5px;
  font-size: 12;
  ${({ theme }) => theme.reactionList.reactionCount.extra}
`;

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
        <Container visible={visible}>
          {this._renderReactions(latestReactions)}
          <ReactionCount>
            {this._getReactionCount(reactionCounts)}
          </ReactionCount>
        </Container>
      </TouchableOpacity>
    );
  }
}
