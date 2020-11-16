import React, { useEffect, useRef } from 'react';
import {
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolate,
  interpolate,
  // @ts-expect-error TODO: Remove on next Reanimated update with new types
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  ScrollView,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';

import { MessageActions } from './MessageActions';
import { OverlayReactions } from './OverlayReactions';
import { OverlayReactionList } from './OverlayReactionList';

import { MessageTextContainer } from '../Message/MessageSimple/MessageTextContainer';

import { Attachment } from '../Attachment/Attachment';
import { FileAttachmentGroup } from '../Attachment/FileAttachmentGroup';
import { Gallery } from '../Attachment/Gallery';
import { MessageAvatar } from '../Message/MessageSimple/MessageAvatar';

import {
  MessageOverlayContextValue,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { vh } from '../../utils/utils';

import type { ReactionResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  containerInner: {
    borderColor: '#E6E6E6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  overlayPadding: {
    padding: 8,
  },
  row: { flexDirection: 'row' },
  scrollView: { overflow: Platform.OS === 'ios' ? 'visible' : 'scroll' },
});

const screenHeight = vh(100);
const halfScreenHeight = vh(50);

export type MessageOverlayPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Pick<MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'reset'> &
  Omit<
    MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>,
    'handleReaction' | 'supportedReactions'
  > & { overlayOpacity: Animated.SharedValue<number>; visible?: boolean };

const MessageOverlayWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    clientId,
    files,
    groupStyles,
    images,
    message,
    messageActions,
    messageContentOrder,
    messageReactionTitle,
    onlyEmojis,
    otherAttachments,
    overlayOpacity,
    reset,
    visible,
  } = props;
  const { overlay, setOverlay } = useOverlayContext();

  const {
    theme: {
      colors: { attachmentBackground, background, grey, transparent },
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS },
          containerInner,
        },
      },
    },
  } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);

  const messageHeight = useSharedValue(0);
  const messageLayout = useSharedValue({ x: 0, y: 0 }, false);
  const messageWidth = useSharedValue(0);
  const reactionListHeight = useSharedValue(0);

  const offsetY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const showScreen = useSharedValue(0);
  const fadeScreen = (show: boolean) => {
    'worklet';
    if (show) {
      offsetY.value = 0;
      translateY.value = 0;
      scale.value = 1;
    }
    showScreen.value = show
      ? withSpring(1, {
          damping: 600,
          mass: 0.5,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
          stiffness: 200,
          velocity: 32,
        })
      : withTiming(
          0,
          {
            duration: 150,
            easing: Easing.out(Easing.ease),
          },
          () => {
            if (!show) {
              runOnJS(reset)();
            }
          },
        );
  };

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
    fadeScreen(!!visible);
  }, [visible]);

  const onPan = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (evt) => {
      translateY.value = offsetY.value + evt.translationY;
      overlayOpacity.value = interpolate(
        translateY.value,
        [0, halfScreenHeight],
        [1, 0.75],
        Extrapolate.CLAMP,
      );
      scale.value = interpolate(
        translateY.value,
        [0, halfScreenHeight],
        [1, 0.85],
        Extrapolate.CLAMP,
      );
    },
    onFinish: (evt) => {
      const finalYPosition = evt.translationY + evt.velocityY * 0.1;

      if (finalYPosition > halfScreenHeight && translateY.value > 0) {
        cancelAnimation(translateY);
        overlayOpacity.value = withTiming(
          0,
          {
            duration: 200,
            easing: Easing.out(Easing.ease),
          },
          () => {
            runOnJS(setOverlay)('none');
          },
        );
        translateY.value =
          evt.velocityY > 1000
            ? withDecay({
                velocity: evt.velocityY,
              })
            : withTiming(screenHeight, {
                duration: 200,
                easing: Easing.out(Easing.ease),
              });
      } else {
        translateY.value = withTiming(0);
        scale.value = withTiming(1);
        overlayOpacity.value = withTiming(1);
      }
    },
    onStart: () => {
      cancelAnimation(translateY);
      offsetY.value = translateY.value;
    },
  });

  const panStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
    ],
  }));

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(
            showScreen.value,
            [0, 1],
            [messageHeight.value / 2, 0],
          ),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [
              alignment === 'left'
                ? -messageWidth.value / 2
                : messageWidth.value / 2,
              0,
            ],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [alignment],
  );

  const groupStyle = `${alignment}_${(
    groupStyles?.[0] || 'bottom'
  ).toLowerCase()}`;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={StyleSheet.absoluteFillObject}
    >
      <PanGestureHandler
        enabled={overlay === 'message'}
        maxPointers={1}
        minDist={10}
        onGestureEvent={onPan}
        waitFor={scrollViewRef}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject]}>
          <SafeAreaView style={styles.flex}>
            <ScrollView
              alwaysBounceVertical={false}
              contentContainerStyle={[
                styles.center,
                {
                  paddingTop: reactionListHeight.value,
                },
              ]}
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              style={[styles.flex, styles.scrollView]}
            >
              <TapGestureHandler
                maxDist={32}
                onHandlerStateChange={({ nativeEvent: { state } }) => {
                  if (state === State.END) {
                    setOverlay('none');
                  }
                }}
                waitFor={scrollViewRef}
              >
                <Animated.View style={[styles.flex, panStyle]}>
                  {message && (
                    <View
                      style={[
                        styles.center,
                        styles.overlayPadding,
                        alignment === 'left'
                          ? styles.alignStart
                          : styles.alignEnd,
                      ]}
                    >
                      <OverlayReactionList
                        messageLayout={messageLayout}
                        ownReactionTypes={(message?.own_reactions as ReactionResponse<
                          Re,
                          Us
                        >[]).map((reaction) => reaction.type)}
                        reactionListHeight={reactionListHeight}
                        showScreen={showScreen}
                      />
                      <Animated.View
                        onLayout={({
                          nativeEvent: {
                            layout: {
                              height: layoutHeight,
                              width: layoutWidth,
                              x,
                              y,
                            },
                          },
                        }) => {
                          messageLayout.value = {
                            x: alignment === 'left' ? x + layoutWidth : x,
                            y,
                          };
                          messageWidth.value = layoutWidth;
                          messageHeight.value = layoutHeight;
                        }}
                        style={[styles.alignEnd, styles.row, showScreenStyle]}
                      >
                        {alignment === 'left' && (
                          <MessageAvatar<At, Ch, Co, Ev, Me, Re, Us>
                            {...{ alignment, message, showAvatar: true }}
                          />
                        )}
                        <View
                          style={[
                            styles.containerInner,
                            {
                              backgroundColor: onlyEmojis
                                ? transparent
                                : otherAttachments?.length
                                ? otherAttachments[0].type === 'giphy'
                                  ? transparent
                                  : attachmentBackground
                                : alignment === 'left'
                                ? background
                                : grey,
                              borderBottomLeftRadius:
                                groupStyle === 'left_bottom' ||
                                groupStyle === 'left_single'
                                  ? borderRadiusS
                                  : borderRadiusL,
                              borderBottomRightRadius:
                                groupStyle === 'right_bottom' ||
                                groupStyle === 'right_single'
                                  ? borderRadiusS
                                  : borderRadiusL,
                            },
                            onlyEmojis || otherAttachments?.length
                              ? { borderWidth: 0 }
                              : {},
                            containerInner,
                          ]}
                        >
                          {messageContentOrder?.map(
                            (messageContentType, messageContentOrderIndex) => {
                              switch (messageContentType) {
                                case 'attachments':
                                  return otherAttachments?.map(
                                    (attachment, attachmentIndex) => (
                                      <Attachment
                                        attachment={attachment}
                                        key={`${message.id}-${attachmentIndex}`}
                                      />
                                    ),
                                  );
                                case 'files':
                                  return (
                                    <FileAttachmentGroup
                                      files={files}
                                      key={`file_attachment_group_${messageContentOrderIndex}`}
                                      messageId={message.id}
                                    />
                                  );
                                case 'gallery':
                                  return (
                                    <Gallery
                                      alignment={alignment}
                                      groupStyles={groupStyles}
                                      images={images}
                                      key={`gallery_${messageContentOrderIndex}`}
                                      messageId={message.id}
                                      messageText={message.text}
                                      preventPress
                                    />
                                  );
                                case 'text':
                                default:
                                  return otherAttachments?.length &&
                                    otherAttachments[0].actions ? null : (
                                    <MessageTextContainer<
                                      At,
                                      Ch,
                                      Co,
                                      Ev,
                                      Me,
                                      Re,
                                      Us
                                    >
                                      key={`message_text_container_${messageContentOrderIndex}`}
                                      message={message}
                                      onlyEmojis={onlyEmojis}
                                    />
                                  );
                              }
                            },
                          )}
                        </View>
                      </Animated.View>
                      {messageActions && (
                        <MessageActions showScreen={showScreen} />
                      )}
                      {!!messageReactionTitle &&
                      message.latest_reactions &&
                      message.latest_reactions.length > 0 ? (
                        <OverlayReactions
                          alignment={alignment}
                          reactions={(message.latest_reactions as ReactionResponse<
                            Re,
                            Us
                          >[]).map((reaction) => ({
                            alignment:
                              clientId && clientId === reaction.user?.id
                                ? 'right'
                                : 'left',
                            image: reaction?.user?.image,
                            name:
                              reaction?.user?.name || reaction.user_id || '',
                            type: reaction.type,
                          }))}
                          showScreen={showScreen}
                          title={messageReactionTitle}
                        />
                      ) : null}
                    </View>
                  )}
                </Animated.View>
              </TapGestureHandler>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment: prevAlignment,
    message: prevMessage,
    messageReactionTitle: prevMessageReactionTitle,
    visible: prevVisible,
  } = prevProps;
  const {
    alignment: nextAlignment,
    message: nextMessage,
    messageReactionTitle: nextMessageReactionTitle,
    visible: nextVisible,
  } = nextProps;

  const visibleEqual = prevVisible === nextVisible;
  if (!visibleEqual) return false;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  const messageReactionTitleEqual =
    prevMessageReactionTitle === nextMessageReactionTitle;
  if (!messageReactionTitleEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage?.latest_reactions) ===
      Array.isArray(nextMessage?.latest_reactions) &&
    ((Array.isArray(prevMessage?.latest_reactions) &&
      Array.isArray(nextMessage?.latest_reactions) &&
      prevMessage?.latest_reactions.length ===
        nextMessage?.latest_reactions.length) ||
      prevMessage?.latest_reactions === nextMessage?.latest_reactions);
  if (!latestReactionsEqual) return false;

  return true;
};

const MemoizedMessageOverlay = React.memo(
  MessageOverlayWithContext,
  areEqual,
) as typeof MessageOverlayWithContext;

export type MessageOverlayProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Partial<
  Omit<
    MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'overlayOpacity'
  >
> &
  Pick<
    MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'overlayOpacity'
  >;

/**
 * MessageOverlay - A high level component which implements all the logic required for a message overlay
 */
export const MessageOverlay = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageOverlayProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment: propAlignment,
    clientId: propClientId,
    files: propFiles,
    groupStyles: propGroupStyles,
    images: propImages,
    message: propMessage,
    messageActions: propMessageActions,
    messageContentOrder: propMessageContentOrder,
    messageReactionTitle: propMessageReactionTitle,
    onlyEmojis: propOnlyEmojis,
    otherAttachments: propOtherAttachments,
    overlayOpacity,
    reset: propReset,
    visible,
  } = props;

  const { data, reset: contextReset } = useMessageOverlayContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const {
    alignment: contextAlignment,
    clientId: contextClientId,
    files: contextFiles,
    groupStyles: contextGroupStyles,
    images: contextImages,
    message: contextMessage,
    messageActions: contextMessageActions,
    messageContentOrder: contextMessageContentOrder,
    messageReactionTitle: contextMessageReactionTitle,
    onlyEmojis: contextOnlyEmojis,
    otherAttachments: contextOtherAttachments,
  } = data || {};

  const alignment = propAlignment || contextAlignment;
  const clientId = propClientId || contextClientId;
  const files = propFiles || contextFiles;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const images = propImages || contextImages;
  const message = propMessage || contextMessage;
  const messageActions = propMessageActions || contextMessageActions;
  const messageContentOrder =
    propMessageContentOrder || contextMessageContentOrder;
  const messageReactionTitle =
    propMessageReactionTitle || contextMessageReactionTitle;
  const onlyEmojis = propOnlyEmojis || contextOnlyEmojis;
  const otherAttachments = propOtherAttachments || contextOtherAttachments;
  const reset = propReset || contextReset;

  return (
    <MemoizedMessageOverlay
      {...{
        alignment,
        clientId,
        files,
        groupStyles,
        images,
        message,
        messageActions,
        messageContentOrder,
        messageReactionTitle,
        onlyEmojis,
        otherAttachments,
        overlayOpacity,
        reset,
        visible,
      }}
    />
  );
};
