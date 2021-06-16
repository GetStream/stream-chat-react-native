import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolate,
  interpolate,
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

import { OverlayReactionList as OverlayReactionListDefault } from './OverlayReactionList';

import { MessageTextContainer } from '../Message/MessageSimple/MessageTextContainer';
import { MessageActions as DefaultMessageActions } from '../MessageOverlay/MessageActions';
import { OverlayReactions as DefaultOverlayReactions } from '../MessageOverlay/OverlayReactions';

import {
  MessageOverlayContextValue,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { MessagesProvider } from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import { vh, vw } from '../../utils/utils';

import type { ReplyProps } from '../Reply/Reply';

import { MessageProvider } from '../../contexts/messageContext/MessageContext';
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
  replyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
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
  Us extends DefaultUserType = DefaultUserType,
> = Pick<
  MessageOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'MessageActions' | 'OverlayReactionList' | 'OverlayReactions' | 'reset'
> &
  Omit<MessageOverlayData<At, Ch, Co, Ev, Me, Re, Us>, 'supportedReactions'> &
  Pick<OverlayContextValue, 'overlay' | 'setOverlay'> & {
    overlayOpacity: Animated.SharedValue<number>;
    visible?: boolean;
  };

const MessageOverlayWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    clientId,
    files,
    groupStyles,
    handleReaction,
    images,
    message,
    messageActions,
    MessageActions = DefaultMessageActions,
    messageContext,
    messageReactionTitle,
    messagesContext,
    onlyEmojis,
    otherAttachments,
    overlay,
    overlayOpacity,
    OverlayReactionList = OverlayReactionListDefault,
    OverlayReactions = DefaultOverlayReactions,
    reset,
    setOverlay,
    threadList,
    visible,
  } = props;

  const { theme } = useTheme();

  const myMessageTheme = messagesContext?.myMessageTheme;
  const wrapMessageInTheme = clientId === message?.user?.id && !!myMessageTheme;

  const [myMessageThemeString, setMyMessageThemeString] = useState(JSON.stringify(myMessageTheme));
  const [reactionListHeight, setReactionListHeight] = useState(0);

  useEffect(() => {
    if (myMessageTheme) {
      setMyMessageThemeString(JSON.stringify(myMessageTheme));
    }
  }, [myMessageTheme]);

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    [myMessageThemeString, theme],
  );

  const {
    colors: { blue_alice, grey_gainsboro, grey_whisper, transparent, white_smoke },
    messageSimple: {
      content: {
        container: { borderRadiusL, borderRadiusS },
        containerInner,
        replyContainer,
      },
    },
  } = wrapMessageInTheme ? modifiedTheme : theme;

  const messageHeight = useSharedValue(0);
  const messageLayout = useSharedValue({ x: 0, y: 0 });
  const messageWidth = useSharedValue(0);

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
          translateY: interpolate(showScreen.value, [0, 1], [messageHeight.value / 2, 0]),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [alignment === 'left' ? -messageWidth.value / 2 : messageWidth.value / 2, 0],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [alignment],
  );

  const groupStyle = `${alignment}_${(groupStyles?.[0] || 'bottom').toLowerCase()}`;

  const hasThreadReplies = !!message?.reply_count;

  const { Attachment, FileAttachmentGroup, Gallery, MessageAvatar, Reply } = messagesContext || {};

  return (
    <MessagesProvider<At, Ch, Co, Ev, Me, Re, Us> value={messagesContext}>
      <MessageProvider value={messageContext}>
        <ThemeProvider mergedStyle={wrapMessageInTheme ? modifiedTheme : theme}>
          <Animated.View
            pointerEvents={visible ? 'auto' : 'none'}
            style={StyleSheet.absoluteFillObject}
          >
            <PanGestureHandler
              enabled={overlay === 'message'}
              maxPointers={1}
              minDist={10}
              onGestureEvent={onPan}
            >
              <Animated.View style={[StyleSheet.absoluteFillObject]}>
                <SafeAreaView style={styles.flex}>
                  <ScrollView
                    alwaysBounceVertical={false}
                    contentContainerStyle={[
                      styles.center,
                      {
                        paddingTop: reactionListHeight,
                      },
                    ]}
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
                    >
                      <Animated.View style={[styles.flex, panStyle]}>
                        {message && (
                          <View
                            style={[
                              styles.center,
                              styles.overlayPadding,
                              alignment === 'left' ? styles.alignStart : styles.alignEnd,
                            ]}
                          >
                            {handleReaction ? (
                              <OverlayReactionList
                                messageLayout={messageLayout}
                                ownReactionTypes={
                                  message?.own_reactions?.map((reaction) => reaction.type) || []
                                }
                                setReactionListHeight={setReactionListHeight}
                                showScreen={showScreen}
                              />
                            ) : null}
                            <Animated.View
                              onLayout={({
                                nativeEvent: {
                                  layout: { height: layoutHeight, width: layoutWidth, x, y },
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
                              {alignment === 'left' && MessageAvatar && (
                                <MessageAvatar {...{ alignment, message, showAvatar: true }} />
                              )}
                              <View
                                style={[
                                  styles.containerInner,
                                  {
                                    backgroundColor:
                                      onlyEmojis && !message.quoted_message
                                        ? transparent
                                        : otherAttachments?.length
                                        ? otherAttachments[0].type === 'giphy'
                                          ? transparent
                                          : blue_alice
                                        : alignment === 'left'
                                        ? white_smoke
                                        : grey_gainsboro,
                                    borderBottomLeftRadius:
                                      (groupStyle === 'left_bottom' ||
                                        groupStyle === 'left_single') &&
                                      (!hasThreadReplies || threadList)
                                        ? borderRadiusS
                                        : borderRadiusL,
                                    borderBottomRightRadius:
                                      (groupStyle === 'right_bottom' ||
                                        groupStyle === 'right_single') &&
                                      (!hasThreadReplies || threadList)
                                        ? borderRadiusS
                                        : borderRadiusL,
                                    borderColor: grey_whisper,
                                  },
                                  (onlyEmojis && !message.quoted_message) ||
                                  otherAttachments?.length
                                    ? { borderWidth: 0 }
                                    : {},
                                  containerInner,
                                ]}
                              >
                                {messagesContext?.messageContentOrder?.map(
                                  (messageContentType, messageContentOrderIndex) => {
                                    switch (messageContentType) {
                                      case 'quoted_reply':
                                        return (
                                          messagesContext?.quotedRepliesEnabled &&
                                          message.quoted_message &&
                                          Reply && (
                                            <View
                                              key={`quoted_reply_${messageContentOrderIndex}`}
                                              style={[styles.replyContainer, replyContainer]}
                                            >
                                              <Reply
                                                quotedMessage={
                                                  message.quoted_message as ReplyProps<
                                                    At,
                                                    Ch,
                                                    Co,
                                                    Ev,
                                                    Me,
                                                    Re,
                                                    Us
                                                  >['quotedMessage']
                                                }
                                                styles={{
                                                  messageContainer: {
                                                    maxWidth: vw(60),
                                                  },
                                                }}
                                              />
                                            </View>
                                          )
                                        );
                                      case 'attachments':
                                        return otherAttachments?.map(
                                          (attachment, attachmentIndex) =>
                                            Attachment && (
                                              <Attachment
                                                attachment={attachment}
                                                key={`${message.id}-${attachmentIndex}`}
                                              />
                                            ),
                                        );
                                      case 'files':
                                        return (
                                          FileAttachmentGroup && (
                                            <FileAttachmentGroup
                                              files={files}
                                              key={`file_attachment_group_${messageContentOrderIndex}`}
                                              messageId={message.id}
                                            />
                                          )
                                        );
                                      case 'gallery':
                                        return (
                                          Gallery && (
                                            <Gallery
                                              alignment={alignment}
                                              groupStyles={groupStyles}
                                              hasThreadReplies={!!message?.reply_count}
                                              images={images}
                                              key={`gallery_${messageContentOrderIndex}`}
                                              messageId={message.id}
                                              messageText={message.text}
                                              threadList={threadList}
                                            />
                                          )
                                        );
                                      case 'text':
                                      default:
                                        return otherAttachments?.length &&
                                          otherAttachments[0].actions ? null : (
                                          <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
                                            key={`message_text_container_${messageContentOrderIndex}`}
                                            message={message}
                                            messageOverlay
                                            onlyEmojis={onlyEmojis}
                                          />
                                        );
                                    }
                                  },
                                )}
                              </View>
                            </Animated.View>
                            {messageActions && <MessageActions showScreen={showScreen} />}
                            {!!messageReactionTitle &&
                            message.latest_reactions &&
                            message.latest_reactions.length > 0 ? (
                              <OverlayReactions
                                alignment={alignment}
                                reactions={message.latest_reactions.map((reaction) => ({
                                  alignment:
                                    clientId && clientId === reaction.user?.id ? 'right' : 'left',
                                  image: reaction?.user?.image,
                                  name: reaction?.user?.name || reaction.user_id || '',
                                  type: reaction.type,
                                }))}
                                showScreen={showScreen}
                                supportedReactions={messagesContext?.supportedReactions}
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
        </ThemeProvider>
      </MessageProvider>
    </MessagesProvider>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
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

  const messageReactionTitleEqual = prevMessageReactionTitle === nextMessageReactionTitle;
  if (!messageReactionTitleEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage?.latest_reactions) && Array.isArray(nextMessage?.latest_reactions)
      ? prevMessage?.latest_reactions.length === nextMessage?.latest_reactions.length &&
        prevMessage?.latest_reactions.every(
          ({ type }, index) => type === nextMessage?.latest_reactions?.[index].type,
        )
      : prevMessage?.latest_reactions === nextMessage?.latest_reactions;
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
  Us extends DefaultUserType = DefaultUserType,
> = Partial<Omit<MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'overlayOpacity'>> &
  Pick<MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'overlayOpacity'>;

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
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageOverlayProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { data, MessageActions, OverlayReactionList, OverlayReactions, reset } =
    useMessageOverlayContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { overlay, setOverlay } = useOverlayContext();

  const componentProps = {
    MessageActions: props.MessageActions || MessageActions,
    OverlayReactionList:
      props.OverlayReactionList || OverlayReactionList || data?.OverlayReactionList,
    OverlayReactions: props.OverlayReactions || OverlayReactions,
  };

  return (
    <MemoizedMessageOverlay
      {...(data || {})}
      {...{
        overlay,
        reset,
        setOverlay,
      }}
      {...props}
      {...componentProps}
    />
  );
};
