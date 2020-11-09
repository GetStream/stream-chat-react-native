import React, { useRef } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import {
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
import type { ReactionResponse } from 'stream-chat';

const styles = StyleSheet.create({
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
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
  >;

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
    groupStyles,
    message,
    messageActions,
    messageReactionTitle,
    reset,
  } = props;

  const scrollViewRef = useRef<ScrollView>(null);

  const messageLayout = useSharedValue({ x: 0, y: 0 });
  const reactionListHeight = useSharedValue(0);

  if (!message) return null;

  const images =
    (Array.isArray(message.attachments) &&
      message.attachments.filter(
        (item) =>
          item.type === 'image' && !item.title_link && !item.og_scrape_url,
      )) ||
    [];
  const files =
    (Array.isArray(message.attachments) &&
      message.attachments.filter((item) => item.type === 'file')) ||
    [];

  return (
    <View style={StyleSheet.absoluteFill}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.center,
            {
              paddingTop: reactionListHeight.value,
            },
          ]}
          ref={scrollViewRef}
          style={[styles.flex, styles.scrollView]}
        >
          <TapGestureHandler
            onHandlerStateChange={({ nativeEvent: { state } }) => {
              if (state === State.END) {
                reset();
              }
            }}
            waitFor={scrollViewRef}
          >
            <View
              style={[
                styles.center,
                styles.overlayPadding,
                alignment === 'left' ? styles.alignStart : styles.alignEnd,
              ]}
            >
              <OverlayReactionList
                messageLayout={messageLayout}
                ownReactionTypes={(message?.own_reactions as ReactionResponse<
                  Re,
                  Us
                >[]).map((reaction) => reaction.type)}
                reactionListHeight={reactionListHeight}
              />
              <View
                onLayout={({
                  nativeEvent: {
                    layout: { width: layoutWidth, x, y },
                  },
                }) => {
                  messageLayout.value = {
                    x: alignment === 'left' ? x + layoutWidth : x,
                    y,
                  };
                }}
                style={[styles.alignEnd, styles.row]}
              >
                {alignment === 'left' && (
                  <MessageAvatar<At, Ch, Co, Ev, Me, Re, Us>
                    {...{ alignment, message, showAvatar: true }}
                  />
                )}
                <View style={styles.alignEnd}>
                  {Array.isArray(message.attachments) &&
                    message.attachments.map((attachment, index) => {
                      // We handle files separately
                      if (
                        attachment.type === 'file' ||
                        (attachment.type === 'image' &&
                          !attachment.title_link &&
                          !attachment.og_scrape_url)
                      ) {
                        return null;
                      }

                      return (
                        <Attachment<At, Ch, Co, Ev, Me, Re, Us>
                          attachment={attachment}
                          key={`${message.id}-${index}`}
                        />
                      );
                    })}
                  <FileAttachmentGroup<At, Ch, Co, Ev, Me, Re, Us>
                    files={files}
                    messageId={message.id}
                  />
                  <Gallery<At, Ch, Co, Ev, Me, Re, Us>
                    alignment={alignment}
                    images={images}
                  />
                  <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
                    alignment={alignment}
                    groupStyles={groupStyles || ['bottom']}
                    message={message}
                  />
                </View>
              </View>
              {messageActions && <MessageActions />}
              {!!messageReactionTitle &&
              message.latest_reactions &&
              message.latest_reactions.length > 0 ? (
                <OverlayReactions
                  reactions={(message.latest_reactions as ReactionResponse<
                    Re,
                    Us
                  >[]).map((reaction) => ({
                    alignment:
                      clientId && clientId === reaction.user?.id
                        ? 'right'
                        : 'left',
                    image: reaction?.user?.image,
                    name: reaction?.user?.name || reaction.user_id || '',
                    type: reaction.type,
                  }))}
                  title={messageReactionTitle}
                />
              ) : null}
            </View>
          </TapGestureHandler>
        </ScrollView>
      </SafeAreaView>
    </View>
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
    groupStyles: prevGroupStyles,
    message: prevMessage,
    messageReactionTitle: prevMessageReactionTitle,
  } = prevProps;
  const {
    alignment: nextAlignment,
    groupStyles: nextGroupStyles,
    message: nextMessage,
    messageReactionTitle: nextMessageReactionTitle,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  const messageReactionTitleEqual =
    prevMessageReactionTitle === nextMessageReactionTitle;
  if (!messageReactionTitleEqual) return false;

  const groupStylesEqual = prevGroupStyles?.[0] === nextGroupStyles?.[0];
  if (!groupStylesEqual) return false;

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
> = Partial<MessageOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

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
    groupStyles: propGroupStyles,
    message: propMessage,
    messageActions: propMessageActions,
    messageReactionTitle: propMessageReactionTitle,
    reset: propReset,
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
    groupStyles: contextGroupStyle,
    message: contextMessage,
    messageActions: contextMessageActions,
    messageReactionTitle: contextMessageReactionTitle,
  } = data || {};

  const alignment = propAlignment || contextAlignment;
  const clientId = propClientId || contextClientId;
  const groupStyles = propGroupStyles || contextGroupStyle;
  const message = propMessage || contextMessage;
  const messageActions = propMessageActions || contextMessageActions;
  const messageReactionTitle =
    propMessageReactionTitle || contextMessageReactionTitle;
  const reset = propReset || contextReset;

  return (
    <MemoizedMessageOverlay
      {...{
        alignment,
        clientId,
        groupStyles,
        message,
        messageActions,
        messageReactionTitle,
        reset,
      }}
    />
  );
};
