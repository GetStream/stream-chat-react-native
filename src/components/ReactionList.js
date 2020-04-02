import React from 'react';
import { Text } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { themed } from '../styles/theme';
import { renderReactions } from '../utils/renderReactions';

import leftTail from '../images/reactionlist/left-tail.png';
import leftCenter from '../images/reactionlist/left-center.png';
import leftEnd from '../images/reactionlist/left-end.png';

import rightTail from '../images/reactionlist/right-tail.png';
import rightCenter from '../images/reactionlist/right-center.png';
import rightEnd from '../images/reactionlist/right-end.png';

const TouchableWrapper = styled.View`
  position: relative;
  ${(props) => (props.alignment === 'left' ? 'left: -10px;' : 'right: -10px;')}
  height: 28px;
  z-index: 10;
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
`;

const Container = styled.View`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  z-index: 10;
  height: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 5px;
  padding-right: 5px;
  ${({ theme }) => theme.message.reactionList.container.css}
`;

const ReactionCount = styled(({ reactionCounts, ...rest }) => (
  <Text {...rest} />
))`
  color: white;
  font-size: 12;
  ${({ reactionCounts }) => (reactionCounts < 10 ? null : 'min-width: 20px;')}
  ${({ theme }) => theme.message.reactionList.reactionCount.css}
`;

const ImageWrapper = styled.View`
  display: flex;
  flex-direction: row;
  top: -23px;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
`;

const LeftTail = styled.Image`
  width: 25px;
  height: 33px;
`;

const LeftCenter = styled.Image`
  height: 33;
  flex: 1;
`;

const LeftEnd = styled.Image`
  width: 14px;
  height: 33px;
`;

const RightTail = styled.Image`
  width: 25px;
  height: 33px;
`;

const RightCenter = styled.Image`
  height: 33;
  flex: 1;
`;

const RightEnd = styled.Image`
  width: 14px;
  height: 33px;
`;

const Reactions = styled.View`
  flex-direction: row;
`;

/**
 * @example ./docs/ReactionList.md
 * @extends PureComponent
 */

export const ReactionList = themed(
  class ReactionList extends React.PureComponent {
    static themePath = 'message.reactionList';

    constructor(props) {
      super(props);
    }

    static propTypes = {
      latestReactions: PropTypes.array,
      openReactionSelector: PropTypes.func,
      getTotalReactionCount: PropTypes.func,
      visible: PropTypes.bool,
      position: PropTypes.string,
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

    render() {
      const {
        latestReactions,
        getTotalReactionCount,
        visible,
        alignment,
        supportedReactions,
      } = this.props;
      return (
        <TouchableWrapper alignment={alignment} activeOpacity={1}>
          <Container visible={visible}>
            <Reactions>
              {renderReactions(latestReactions, supportedReactions)}
            </Reactions>
            <ReactionCount reactionCounts={getTotalReactionCount()}>
              {getTotalReactionCount()}
            </ReactionCount>
          </Container>
          <ImageWrapper visible={visible}>
            {alignment === 'left' ? (
              <React.Fragment>
                <LeftTail source={leftTail} />
                <LeftCenter source={leftCenter} resizeMode="stretch" />
                <LeftEnd source={leftEnd} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <RightEnd source={rightEnd} />
                <RightCenter source={rightCenter} resizeMode="stretch" />
                <RightTail source={rightTail} />
              </React.Fragment>
            )}
          </ImageWrapper>
        </TouchableWrapper>
      );
    }
  },
);
