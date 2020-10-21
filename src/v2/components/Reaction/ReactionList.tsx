import React from 'react';
import {
  Image,
  ImageRequireSource,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { renderReactions } from './utils/renderReactions';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { emojiData } from '../../utils/utils';

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

const leftTail: ImageRequireSource = require('../../../images/reactionlist/left-tail.png');
const leftCenter: ImageRequireSource = require('../../../images/reactionlist/left-center.png');
const leftEnd: ImageRequireSource = require('../../../images/reactionlist/left-end.png');

const rightTail: ImageRequireSource = require('../../../images/reactionlist/right-tail.png');
const rightCenter: ImageRequireSource = require('../../../images/reactionlist/right-center.png');
const rightEnd: ImageRequireSource = require('../../../images/reactionlist/right-end.png');

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 24,
    paddingHorizontal: 5,
    zIndex: 1,
  },
  imageWrapper: {
    flexDirection: 'row',
    top: -23,
  },
  leftCenter: {
    flex: 1,
    height: 33,
  },
  leftEnd: {
    height: 33,
    width: 14,
  },
  leftTail: {
    height: 33,
    width: 25,
  },
  reactionCount: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  reactions: {
    flexDirection: 'row',
  },
  rightCenter: {
    flex: 1,
    height: 33,
  },
  rightEnd: {
    height: 33,
    width: 14,
  },
  rightTail: {
    height: 33,
    width: 25,
  },
  wrapper: {
    height: 28,
    zIndex: 10,
  },
  wrapperLeftAlign: {
    alignSelf: 'flex-start',
    left: -10,
  },
  wrapperRightAlign: {
    alignSelf: 'flex-end',
    right: -10,
  },
});

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

/**
 * @example ./ReactionList.md
 */
export const ReactionList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ReactionListProps<At, Ch, Co, Me, Re, Us>,
) => {
  const {
    alignment,
    getTotalReactionCount,
    latestReactions,
    supportedReactions = emojiData,
    visible,
  } = props;

  const {
    theme: {
      message: {
        reactionList: { container, reactionCount },
      },
    },
  } = useTheme();

  if (!visible) return null;

  const totalReactionCount = getTotalReactionCount(supportedReactions);

  return (
    <View
      style={[
        styles.wrapper,
        alignment === 'left'
          ? styles.wrapperLeftAlign
          : styles.wrapperRightAlign,
      ]}
      testID='reaction-list'
    >
      <View style={[styles.container, container]}>
        <View style={styles.reactions}>
          {renderReactions(latestReactions, supportedReactions)}
        </View>
        <Text
          style={[
            styles.reactionCount,
            totalReactionCount < 10 ? {} : { minWidth: 20 },
            reactionCount,
          ]}
        >
          {totalReactionCount}
        </Text>
      </View>
      <View style={styles.imageWrapper}>
        {alignment === 'left' ? (
          <>
            <Image source={leftTail} style={styles.leftTail} />
            <Image
              resizeMode='stretch'
              source={leftCenter}
              style={styles.leftCenter}
            />
            <Image source={leftEnd} style={styles.leftEnd} />
          </>
        ) : (
          <>
            <Image source={rightEnd} style={styles.rightEnd} />
            <Image
              resizeMode='stretch'
              source={rightCenter}
              style={styles.rightCenter}
            />
            <Image source={rightTail} style={styles.rightTail} />
          </>
        )}
      </View>
    </View>
  );
};

ReactionList.displayName = 'ReactionList{message{reactionList}}';
