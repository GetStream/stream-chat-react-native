import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Avatar } from '../Avatar/Avatar';

import { Unknown } from '../../icons/Unknown';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ReactionData, reactionData } from '../../utils/utils';

import type { Alignment } from '../../contexts/messageContext/MessageContext';

const styles = StyleSheet.create({
  avatarContainer: {
    padding: 8,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '700',
    paddingTop: 6,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    width: '100%',
  },
  flatListContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reactionBubble: {
    alignItems: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    position: 'absolute',
  },
  reactionBubbleBackground: {
    borderRadius: 24,
    height: 24,
    position: 'absolute',
    width: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    paddingTop: 16,
  },
});

export type Reaction = {
  alignment: Alignment;
  name: string;
  type: string;
  image?: string;
};

export type OverlayReactionsProps = {
  reactions: Reaction[];
  title: string;
  supportedReactions?: ReactionData[];
};

const ReactionIcon: React.FC<
  Pick<Reaction, 'type'> & {
    pathFill: string;
    size: number;
    supportedReactions: ReactionData[];
  }
> = ({ pathFill, size, supportedReactions, type }) => {
  const Icon =
    supportedReactions.find((reaction) => reaction.type === type)?.Icon ||
    Unknown;
  return <Icon height={size} pathFill={pathFill} width={size} />;
};

/**
 * OverlayReactions - A high level component which implements all the logic required for message overlay reactions
 */
export const OverlayReactions: React.FC<OverlayReactionsProps> = (props) => {
  const { reactions, supportedReactions = reactionData, title } = props;

  const {
    theme: {
      colors: { grey, primary, white },
      overlay: {
        padding: overlayPadding,
        reactions: {
          avatarContainer,
          avatarName,
          avatarSize,
          container,
          flatListContainer,
          radius,
          reactionBubble,
          reactionBubbleBackground,
          title: titleStyle,
        },
      },
    },
  } = useTheme();

  const width = useWindowDimensions().width;

  const numColumns = Math.floor(
    (width -
      overlayPadding * 2 -
      ((Number(flatListContainer.paddingHorizontal || 0) ||
        styles.flatListContainer.paddingHorizontal) +
        (Number(avatarContainer.padding || 0) ||
          styles.avatarContainer.padding)) *
        2) /
      (avatarSize +
        (Number(avatarContainer.padding || 0) ||
          styles.avatarContainer.padding) *
          2),
  );

  const renderItem = ({
    item: { alignment = 'left', image, name, type },
  }: {
    item: Reaction;
  }) => {
    const x =
      overlayPadding +
      avatarSize / 2 -
      (avatarSize / (radius * 3)) * (alignment === 'left' ? 1 : -1);
    const y = overlayPadding + avatarSize - radius;

    const left =
      alignment === 'left'
        ? x -
          (Number(reactionBubbleBackground.width || 0) ||
            styles.reactionBubbleBackground.width) +
          radius
        : x - radius;
    const top =
      y -
      radius -
      (Number(reactionBubbleBackground.height || 0) ||
        styles.reactionBubbleBackground.height);

    return (
      <View style={[styles.avatarContainer, avatarContainer]}>
        <Avatar image={image} name={name} size={avatarSize} />
        <View style={[StyleSheet.absoluteFill]}>
          <Svg>
            <Circle
              cx={
                x - (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)
              }
              cy={y - radius * 2 - radius / 4}
              fill={alignment === 'left' ? grey : white}
              r={radius * 2}
              stroke={alignment === 'left' ? white : grey}
              strokeWidth={radius / 2}
            />
            <Circle
              cx={x}
              cy={y}
              fill={alignment === 'left' ? grey : white}
              r={radius}
              stroke={alignment === 'left' ? white : grey}
              strokeWidth={radius / 2}
            />
          </Svg>
          <View
            style={[
              styles.reactionBubbleBackground,
              {
                backgroundColor: alignment === 'left' ? grey : white,
                borderColor: alignment === 'left' ? white : grey,
                borderWidth: radius / 2,
                left,
                top,
              },
              reactionBubbleBackground,
            ]}
          />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={
                  x -
                  (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)
                }
                cy={y - radius * 2 - radius / 4}
                fill={alignment === 'left' ? grey : white}
                r={radius * 2 - radius / 2}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.reactionBubble,
              {
                backgroundColor: alignment === 'left' ? grey : white,
                height:
                  (reactionBubble.borderRadius ||
                    styles.reactionBubble.borderRadius) -
                  radius / 2,
                left,
                top,
                width:
                  (reactionBubble.borderRadius ||
                    styles.reactionBubble.borderRadius) -
                  radius / 2,
              },
              reactionBubble,
            ]}
          >
            <ReactionIcon
              pathFill={primary}
              size={
                (reactionBubble.borderRadius ||
                  styles.reactionBubble.borderRadius) / 2
              }
              supportedReactions={supportedReactions}
              type={type}
            />
          </View>
        </View>
        <Text style={[styles.avatarName, avatarName]}>{name}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <FlatList
        data={reactions}
        keyExtractor={({ name }, index) => `${name}_${index}`}
        numColumns={numColumns}
        renderItem={renderItem}
        style={[styles.flatListContainer, flatListContainer]}
      />
    </View>
  );
};

OverlayReactions.displayName = 'OverlayReactions{overlay{reactions}}';
