import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
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

import { MessageActionList as DefaultMessageActionList } from './MessageActionList';
import { OverlayReactionList as OverlayReactionListDefault } from './OverlayReactionList';
import { OverlayReactionsAvatar as OverlayReactionsAvatarDefault } from './OverlayReactionsAvatar';

import { MessageProvider } from '../../contexts/messageContext/MessageContext';
import {
  MessageOverlayContextValue,
  MessageOverlayData,
  useMessageOverlayContext,
} from '../../contexts/messageOverlayContext/MessageOverlayContext';

import { MessagesProvider } from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  OverlayProviderProps,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { vh, vw } from '../../utils/utils';
import { MessageTextContainer } from '../Message/MessageSimple/MessageTextContainer';
import {
  OverlayReactions as DefaultOverlayReactions,
  Reaction,
} from '../MessageOverlay/OverlayReactions';
import type { ReplyProps } from '../Reply/Reply';

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
const DefaultMessageTextNumberOfLines = 5;

export type MessageOverlayPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageOverlayContextValue<StreamChatGenerics>,
  | 'MessageActionList'
  | 'MessageActionListItem'
  | 'OverlayReactionList'
  | 'OverlayReactions'
  | 'OverlayReactionsAvatar'
> &
  Omit<MessageOverlayData<StreamChatGenerics>, 'supportedReactions'> &
  Pick<OverlayContextValue, 'overlay' | 'setOverlay'> &
  Pick<
    OverlayProviderProps<StreamChatGenerics>,
    | 'error'
    | 'isMyMessage'
    | 'isThreadMessage'
    | 'message'
    | 'messageReactions'
    | 'messageTextNumberOfLines'
  > & {
    overlayOpacity: Animated.SharedValue<number>;
    showScreen?: Animated.SharedValue<number>;
  };

const MessageOverlayWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageOverlayPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment,
    ownCapabilities,
    clientId,
    files,
    groupStyles,
    handleReaction,
    images,
    message,
    messageActions,
    MessageActionList = DefaultMessageActionList,
    MessageActionListItem,
    messageContext,
    messageReactionTitle,
    messageTextNumberOfLines = DefaultMessageTextNumberOfLines,
    messagesContext,
    onlyEmojis,
    otherAttachments,
    overlay,
    overlayOpacity,
    OverlayReactionList = OverlayReactionListDefault,
    OverlayReactions = DefaultOverlayReactions,
    OverlayReactionsAvatar = OverlayReactionsAvatarDefault,
    setOverlay,
    threadList,
    videos,
    isMyMessage,
    messageReactions,
    error,
    isThreadMessage,
  } = props;

  const messageActionProps = {
    error,
    isMyMessage,
    isThreadMessage,
    message,
    messageReactions,
  };

  const { theme } = useTheme();

  const myMessageTheme = messagesContext?.myMessageTheme;
  const wrapMessageInTheme = clientId === message?.user?.id && !!myMessageTheme;

  const [myMessageThemeString, setMyMessageThemeString] = useState(JSON.stringify(myMessageTheme));

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
    overlay: { container: containerStyle, padding: overlayPadding },
  } = wrapMessageInTheme ? modifiedTheme : theme;

  const messageHeight = useSharedValue(0);
  const messageLayout = useSharedValue({ x: 0, y: 0 });
  const messageWidth = useSharedValue(0);

  const offsetY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const showScreen = useSharedValue(0);
  const fadeScreen = () => {
    'worklet';

    offsetY.value = 0;
    translateY.value = 0;
    scale.value = 1;
    showScreen.value = withSpring(1, {
      damping: 600,
      mass: 0.5,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
      stiffness: 200,
      velocity: 32,
    });
  };

  useEffect(() => {
    Keyboard.dismiss();
    fadeScreen();
  }, []);

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
    <MessagesProvider value={messagesContext}>
      <MessageProvider value={messageContext}>
        <ThemeProvider mergedStyle={wrapMessageInTheme ? modifiedTheme : theme}>
          <Animated.View
            pointerEvents={'auto'}
            style={[StyleSheet.absoluteFillObject, containerStyle]}
          >
            <PanGestureHandler
              enabled={overlay === 'message'}
              maxPointers={1}
              minDist={10}
              onGestureEvent={onPan}
            >
              <Animated.View style={[StyleSheet.absoluteFillObject]}>
                <SafeAreaView style={styles.flex}>
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
                            { padding: overlayPadding },
                            alignment === 'left' ? styles.alignStart : styles.alignEnd,
                          ]}
                        >
                          {handleReaction && ownCapabilities?.sendReaction ? (
                            <OverlayReactionList
                              messageLayout={messageLayout}
                              ownReactionTypes={
                                message?.own_reactions?.map((reaction) => reaction.type) || []
                              }
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
                                        ? !message.quoted_message
                                          ? transparent
                                          : grey_gainsboro
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
                                (onlyEmojis && !message.quoted_message) || otherAttachments?.length
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
                                        message.quoted_message &&
                                        Reply && (
                                          <View
                                            key={`quoted_reply_${messageContentOrderIndex}`}
                                            style={[styles.replyContainer, replyContainer]}
                                          >
                                            <Reply
                                              quotedMessage={
                                                message.quoted_message as ReplyProps<StreamChatGenerics>['quotedMessage']
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
                                            message={message}
                                            threadList={threadList}
                                            videos={videos}
                                          />
                                        )
                                      );
                                    case 'text':
                                    default:
                                      return otherAttachments?.length &&
                                        otherAttachments[0].actions ? null : (
                                        <MessageTextContainer<StreamChatGenerics>
                                          key={`message_text_container_${messageContentOrderIndex}`}
                                          message={message}
                                          messageOverlay
                                          messageTextNumberOfLines={messageTextNumberOfLines}
                                          onlyEmojis={onlyEmojis}
                                        />
                                      );
                                  }
                                },
                              )}
                            </View>
                          </Animated.View>
                          {messageActions && (
                            <MessageActionList
                              MessageActionListItem={MessageActionListItem}
                              showScreen={showScreen}
                              {...messageActionProps}
                              message={message}
                            />
                          )}
                          {!!messageReactionTitle &&
                          message.latest_reactions &&
                          message.latest_reactions.length > 0 ? (
                            <OverlayReactions
                              alignment={alignment}
                              OverlayReactionsAvatar={OverlayReactionsAvatar}
                              reactions={
                                message.latest_reactions.map((reaction) => ({
                                  alignment:
                                    clientId && clientId === reaction.user?.id ? 'right' : 'left',
                                  id: reaction?.user?.id || '',
                                  image: reaction?.user?.image,
                                  name: reaction?.user?.name || reaction.user_id || '',
                                  type: reaction.type,
                                })) as Reaction[]
                              }
                              showScreen={showScreen}
                              supportedReactions={messagesContext?.supportedReactions}
                              title={messageReactionTitle}
                            />
                          ) : null}
                        </View>
                      )}
                    </Animated.View>
                  </TapGestureHandler>
                </SafeAreaView>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </ThemeProvider>
      </MessageProvider>
    </MessagesProvider>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageOverlayPropsWithContext<StreamChatGenerics>,
  nextProps: MessageOverlayPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment: prevAlignment,
    message: prevMessage,
    messageReactionTitle: prevMessageReactionTitle,
  } = prevProps;
  const {
    alignment: nextAlignment,
    message: nextMessage,
    messageReactionTitle: nextMessageReactionTitle,
  } = nextProps;

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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<MessageOverlayPropsWithContext<StreamChatGenerics>, 'overlayOpacity'>> &
  Pick<MessageOverlayPropsWithContext<StreamChatGenerics>, 'overlayOpacity'> &
  Pick<
    MessageOverlayPropsWithContext<StreamChatGenerics>,
    'isMyMessage' | 'error' | 'isThreadMessage' | 'message' | 'messageReactions'
  >;

/**
 * MessageOverlay - A high level component which implements all the logic required for a message overlay
 */
export const MessageOverlay = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageOverlayProps<StreamChatGenerics>,
) => {
  const {
    data,
    MessageActionList,
    MessageActionListItem,
    OverlayReactionList,
    OverlayReactions,
    OverlayReactionsAvatar,
  } = useMessageOverlayContext<StreamChatGenerics>();
  const { overlay, setOverlay } = useOverlayContext();

  const componentProps = {
    MessageActionList: props.MessageActionList || MessageActionList,
    MessageActionListItem: props.MessageActionListItem || MessageActionListItem,
    OverlayReactionList:
      props.OverlayReactionList || OverlayReactionList || data?.OverlayReactionList,
    OverlayReactions: props.OverlayReactions || OverlayReactions,
    OverlayReactionsAvatar: props.OverlayReactionsAvatar || OverlayReactionsAvatar,
  };

  return (
    <MemoizedMessageOverlay
      {...{
        overlay,
        setOverlay,
      }}
      {...componentProps}
      {...(data || {})}
      {...props}
    />
  );
};
