import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { renderReactions } from './utils/renderReactions';

import leftTail from '../../images/reactionlist/left-tail.png';
import leftCenter from '../../images/reactionlist/left-center.png';
import leftEnd from '../../images/reactionlist/left-end.png';

import rightTail from '../../images/reactionlist/right-tail.png';
import rightCenter from '../../images/reactionlist/right-center.png';
import rightEnd from '../../images/reactionlist/right-end.png';

import { themed } from '../../styles/theme';
import { emojiData } from '../../utils/utils';

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  height: 24px;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  padding-horizontal: 5px;
  z-index: 1;
  ${({ theme }) => theme.message.reactionList.container.css}
`;

const ImageWrapper = styled.View`
  flex-direction: row;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  top: -23px;
`;

const LeftCenter = styled.Image`
  flex: 1;
  height: 33;
`;

const LeftEnd = styled.Image`
  height: 33px;
  width: 14px;
`;

const LeftTail = styled.Image`
  height: 33px;
  width: 25px;
`;

const ReactionCount = styled.Text`
  color: white;
  font-size: 12px;
  ${({ reactionCounts }) => (reactionCounts < 10 ? null : 'min-width: 20px;')}
  ${({ theme }) => theme.message.reactionList.reactionCount.css}
`;

const Reactions = styled.View`
  flex-direction: row;
`;

const RightCenter = styled.Image`
  flex: 1;
  height: 33;
`;

const RightEnd = styled.Image`
  height: 33px;
  width: 14px;
`;

const RightTail = styled.Image`
  height: 33px;
  width: 25px;
`;

const TouchableWrapper = styled.View`
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  height: 28px;
  position: relative;
  ${({ alignment }) =>
    alignment === 'left' ? 'left: -10px;' : 'right: -10px;'}
  z-index: 10;
`;

/**
 * @example ../docs/ReactionList.md
 */
const ReactionList = ({
  alignment,
  getTotalReactionCount,
  latestReactions,
  supportedReactions = emojiData,
  visible,
}) => (
  <TouchableWrapper
    activeOpacity={1}
    alignment={alignment}
    testID='reaction-list'
  >
    <Container visible={visible}>
      <Reactions>
        {renderReactions(latestReactions, supportedReactions)}
      </Reactions>
      <ReactionCount reactionCounts={getTotalReactionCount(supportedReactions)}>
        {getTotalReactionCount(supportedReactions)}
      </ReactionCount>
    </Container>
    <ImageWrapper visible={visible}>
      {alignment === 'left' ? (
        <>
          <LeftTail source={leftTail} />
          <LeftCenter resizeMode='stretch' source={leftCenter} />
          <LeftEnd source={leftEnd} />
        </>
      ) : (
        <>
          <RightEnd source={rightEnd} />
          <RightCenter resizeMode='stretch' source={rightCenter} />
          <RightTail source={rightTail} />
        </>
      )}
    </ImageWrapper>
  </TouchableWrapper>
);

ReactionList.themePath = 'message.reactionList';

ReactionList.propTypes = {
  alignment: PropTypes.oneOf(['left', 'right']),
  getTotalReactionCount: PropTypes.func,
  latestReactions: PropTypes.array,
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
  visible: PropTypes.bool,
};

export default themed(ReactionList);
