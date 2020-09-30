import React from 'react';

import { renderReactions } from './utils/renderReactions';

import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';
import { emojiData } from '../../utils/utils';

import type { ImageRequireSource } from 'react-native';

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
  UnknownType,
} from '../../types/types';

const leftTail: ImageRequireSource = require('../../images/reactionlist/left-tail.png');
const leftCenter: ImageRequireSource = require('../../images/reactionlist/left-center.png');
const leftEnd: ImageRequireSource = require('../../images/reactionlist/left-end.png');

const rightTail: ImageRequireSource = require('../../images/reactionlist/right-tail.png');
const rightCenter: ImageRequireSource = require('../../images/reactionlist/right-center.png');
const rightEnd: ImageRequireSource = require('../../images/reactionlist/right-end.png');

export type LatestReactions<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageWithDates<At, Ch, Co, Me, Re, Us>['latest_reactions'];

export type Reaction = {
  icon: string;
  id: string;
};

export type ReactionListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  alignment: Alignment;
  getTotalReactionCount: (
    arg: {
      icon: string;
      id: string;
    }[],
  ) => number;
  latestReactions: LatestReactions<At, Ch, Co, Me, Re, Us>;
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
  visible: boolean;
};

const Container = styled.View`
  align-items: center;
  flex-direction: row;
  height: 24px;
  padding-horizontal: 5px;
  z-index: 1;
  ${({ theme }) => theme.message.reactionList.container.css}
`;

const ImageWrapper = styled.View`
  flex-direction: row;
  top: -23px;
`;

const LeftCenter = styled.Image`
  flex: 1;
  height: 33px;
`;

const LeftEnd = styled.Image`
  height: 33px;
  width: 14px;
`;

const LeftTail = styled.Image`
  height: 33px;
  width: 25px;
`;

const ReactionCount = styled.Text<{ reactionCounts: number }>`
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
  height: 33px;
`;

const RightEnd = styled.Image`
  height: 33px;
  width: 14px;
`;

const RightTail = styled.Image`
  height: 33px;
  width: 25px;
`;

const TouchableWrapper = styled.View<{ alignment: Alignment }>`
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  height: 28px;
  position: relative;
  ${({ alignment }) => `${alignment === 'left' ? 'left' : 'right'}: -10px`}
  z-index: 10;
`;

/**
 * @example ./ReactionList.md
 */
const ReactionList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  alignment,
  getTotalReactionCount,
  latestReactions,
  supportedReactions = emojiData,
  visible,
}: ReactionListProps<At, Ch, Co, Me, Re, Us>) => (
  <TouchableWrapper alignment={alignment} testID='reaction-list'>
    {visible && (
      <Container>
        <Reactions>
          {renderReactions<At, Ch, Co, Me, Re, Us>(
            latestReactions,
            supportedReactions,
          )}
        </Reactions>
        <ReactionCount
          reactionCounts={getTotalReactionCount(supportedReactions)}
        >
          {getTotalReactionCount(supportedReactions)}
        </ReactionCount>
      </Container>
    )}
    {visible && (
      <ImageWrapper>
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
    )}
  </TouchableWrapper>
);

ReactionList.themePath = 'message.reactionList';

export default themed(ReactionList) as typeof ReactionList;
