import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Avatar } from '../Avatar/Avatar';

import {
  LOLReaction,
  LoveReaction,
  ThumbsDownReaction,
  ThumbsUpReaction,
  Unknown,
  WutReaction,
} from '../../icons';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Alignment } from '../../contexts/messageContext/MessageContext';
import type { ReactionData } from '../../utils/utils';

const styles = StyleSheet.create({
  avatarContainer: {
    padding: 8,
  },
  avatarInnerContainer: { alignSelf: 'center' },
  avatarName: {
    fontSize: 12,
    fontWeight: '700',
    paddingTop: 6,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
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

const reactionData: ReactionData[] = [
  {
    Icon: LoveReaction,
    type: 'love',
  },
  {
    Icon: ThumbsUpReaction,
    type: 'like',
  },
  {
    Icon: ThumbsDownReaction,
    type: 'sad',
  },
  {
    Icon: LOLReaction,
    type: 'haha',
  },
  {
    Icon: WutReaction,
    type: 'wow',
  },
];

export type Reaction = {
  alignment: Alignment;
  name: string;
  type: string;
  image?: string;
};

export type OverlayReactionsProps = {
  reactions: Reaction[];
  showScreen: Animated.SharedValue<number>;
  title: string;
  alignment?: Alignment;
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
  const {
    alignment: overlayAlignment,
    reactions,
    supportedReactions = reactionData,
    showScreen,
    title,
  } = props;
  const layoutHeight = useSharedValue(0);
  const layoutWidth = useSharedValue(0);

  const {
    theme: {
      colors: { accent_blue, black, grey_gainsboro, white },
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
      avatarSize / 2 -
      (avatarSize / (radius * 4)) * (alignment === 'left' ? 1 : -1);
    const y = avatarSize - radius;

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
        <View style={styles.avatarInnerContainer}>
          <Avatar image={image} name={name} size={avatarSize} />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={
                  x -
                  (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)
                }
                cy={y - radius * 2 - radius / 4}
                fill={alignment === 'left' ? grey_gainsboro : white}
                r={radius * 2}
                stroke={alignment === 'left' ? white : grey_gainsboro}
                strokeWidth={radius / 2}
              />
              <Circle
                cx={x}
                cy={y}
                fill={alignment === 'left' ? grey_gainsboro : white}
                r={radius}
                stroke={alignment === 'left' ? white : grey_gainsboro}
                strokeWidth={radius / 2}
              />
            </Svg>
            <View
              style={[
                styles.reactionBubbleBackground,
                {
                  backgroundColor:
                    alignment === 'left' ? grey_gainsboro : white,
                  borderColor: alignment === 'left' ? white : grey_gainsboro,
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
                  fill={alignment === 'left' ? grey_gainsboro : white}
                  r={radius * 2 - radius / 2}
                />
              </Svg>
            </View>
            <View
              style={[
                styles.reactionBubble,
                {
                  backgroundColor:
                    alignment === 'left' ? grey_gainsboro : white,
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
                pathFill={accent_blue}
                size={
                  (reactionBubble.borderRadius ||
                    styles.reactionBubble.borderRadius) / 2
                }
                supportedReactions={supportedReactions}
                type={type}
              />
            </View>
          </View>
        </View>
        <Text style={[styles.avatarName, { color: black }, avatarName]}>
          {name}
        </Text>
      </View>
    );
  };

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(
            showScreen.value,
            [0, 1],
            [-layoutHeight.value / 2, 0],
          ),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [
              overlayAlignment === 'left'
                ? -layoutWidth.value / 2
                : layoutWidth.value / 2,
              0,
            ],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [overlayAlignment],
  );

  return (
    <Animated.View
      onLayout={({ nativeEvent: { layout } }) => {
        layoutWidth.value = layout.width;
        layoutHeight.value = layout.height;
      }}
      style={[
        styles.container,
        { backgroundColor: white },
        container,
        showScreenStyle,
      ]}
    >
      <Text style={[styles.title, { color: black }, titleStyle]}>{title}</Text>
      <FlatList
        data={reactions}
        keyExtractor={({ name }, index) => `${name}_${index}`}
        numColumns={numColumns}
        renderItem={renderItem}
        style={[styles.flatListContainer, flatListContainer]}
      />
    </Animated.View>
  );
};

OverlayReactions.displayName = 'OverlayReactions{overlay{reactions}}';
