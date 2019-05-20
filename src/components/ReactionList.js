import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components';
import { emojiData } from '../utils';

const Container = styled.View`
  opacity: ${(props) =>
    props.visible ? props.theme.reactionList.container.opacity : 0};
  display: ${({ theme }) => theme.reactionList.container.display};
  flex-direction: ${({ theme }) => theme.reactionList.container.flexDirection};
  align-items: ${({ theme }) => theme.reactionList.container.alignItems};
  background-color: ${({ theme }) =>
    theme.reactionList.container.backgroundColor};
  padding: ${({ theme }) => theme.reactionList.container.padding}px;
  border-radius: ${({ theme }) => theme.reactionList.container.borderRadius};
`;

const ReactionCount = styled.Text`
  color: ${(props) => props.theme.reactionList.reactionCount.color};
  padding-left: ${(props) =>
    props.theme.reactionList.reactionCount.paddingLeft}px;
  padding-right: ${(props) =>
    props.theme.reactionList.reactionCount.paddingRight}px;
  font-size: ${(props) => props.theme.reactionList.reactionCount.fontSize};
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
