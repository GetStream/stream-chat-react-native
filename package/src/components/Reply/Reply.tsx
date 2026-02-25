import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import {
  isFileAttachment,
  isImageAttachment,
  isVideoAttachment,
  MessageComposerState,
} from 'stream-chat';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';
import { checkQuotedMessageEquality } from '../../utils/utils';
import { FileIcon } from '../Attachment/FileIcon';
import { AttachmentRemoveControl } from '../MessageInput/components/AttachmentPreview/AttachmentRemoveControl';
import { MessagePreview } from '../MessagePreview/MessagePreview';
import { VideoPlayIndicator } from '../ui/VideoPlayIndicator';

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const RightContent = React.memo(
  (props: Pick<ReplyPropsWithContext, 'ImageComponent' | 'message'>) => {
    const { ImageComponent, message } = props;
    const attachments = message?.attachments;
    const styles = useStyles();

    if (!attachments || attachments.length > 1) {
      return null;
    }

    const attachment = attachments?.[0];
    const uri = attachment?.image_url || attachment?.thumb_url;

    if (
      attachment &&
      (isImageAttachment(attachment) ||
        attachment.type === FileTypes.Giphy ||
        attachment.type === FileTypes.Imgur)
    ) {
      return (
        <View style={[styles.contentWrapper, styles.contentBorder]}>
          <ImageComponent source={{ uri }} style={StyleSheet.absoluteFillObject} />
        </View>
      );
    }
    if (attachment && isVideoAttachment(attachment)) {
      return (
        <View style={[styles.contentWrapper, styles.contentBorder]}>
          <View style={styles.attachmentContainer}>
            <Image source={{ uri: attachment.thumb_url }} style={StyleSheet.absoluteFillObject} />
            <VideoPlayIndicator size='sm' />
          </View>
        </View>
      );
    }

    if (attachment && isFileAttachment(attachment)) {
      return <FileIcon mimeType={attachment.mime_type} size={40} />;
    }

    return null;
  },
);

export type ReplyPropsWithContext = Pick<ChatContextValue, 'ImageComponent'> &
  Pick<MessageContextValue, 'message'> &
  Pick<MessagesContextValue, 'quotedMessage'> & {
    isMyMessage: boolean;
    onDismiss?: () => void;
    mode: 'reply' | 'edit';
    // This is temporary for the MessageContent Component to style the Reply component
    styles?: {
      container?: ViewStyle;
      leftContainer?: ViewStyle;
      rightContainer?: ViewStyle;
      title?: TextStyle;
      subtitleContainer?: ViewStyle;
      dismissWrapper?: ViewStyle;
    };
  };

export const ReplyWithContext = (props: ReplyPropsWithContext) => {
  const {
    isMyMessage,
    ImageComponent,
    message: messageFromContext,
    mode,
    onDismiss,
    quotedMessage,
    styles: stylesProp,
  } = props;
  const {
    theme: {
      reply: {
        wrapper,
        container,
        leftContainer,
        rightContainer,
        title: titleStyle,
        dismissWrapper,
      },
    },
  } = useTheme();
  const styles = useStyles();

  const title = useMemo(
    () =>
      mode === 'edit'
        ? 'Edit Message'
        : isMyMessage
          ? 'You'
          : quotedMessage?.user?.name
            ? `Reply to ${quotedMessage?.user?.name}`
            : 'Reply',
    [mode, isMyMessage, quotedMessage?.user?.name],
  );

  if (!quotedMessage) {
    return null;
  }

  return (
    <View style={[!messageFromContext?.quoted_message ? styles.wrapper : null, wrapper]}>
      <View style={[styles.container, container, stylesProp?.container]}>
        <View style={[styles.leftContainer, leftContainer, stylesProp?.leftContainer]}>
          <View style={styles.titleContainer}>
            <Text numberOfLines={1} style={[styles.title, titleStyle, stylesProp?.title]}>
              {title}
            </Text>
          </View>

          <MessagePreview message={quotedMessage} textStyle={styles.subtitle} />
        </View>
        <View style={[styles.rightContainer, rightContainer, stylesProp?.rightContainer]}>
          <RightContent ImageComponent={ImageComponent} message={quotedMessage} />
        </View>
      </View>
      {onDismiss ? (
        <View style={[styles.dismissWrapper, dismissWrapper, stylesProp?.dismissWrapper]}>
          <AttachmentRemoveControl onPress={onDismiss} />
        </View>
      ) : null}
    </View>
  );
};

const areEqual = (prevProps: ReplyPropsWithContext, nextProps: ReplyPropsWithContext) => {
  const {
    isMyMessage: prevIsMyMessage,
    mode: prevMode,
    quotedMessage: prevQuotedMessage,
  } = prevProps;
  const {
    isMyMessage: nextIsMyMessage,
    mode: nextMode,
    quotedMessage: nextQuotedMessage,
  } = nextProps;

  const isMyMessageEqual = prevIsMyMessage === nextIsMyMessage;

  if (!isMyMessageEqual) {
    return false;
  }

  const modeEqual = prevMode === nextMode;
  if (!modeEqual) {
    return false;
  }

  const messageEqual =
    prevQuotedMessage &&
    nextQuotedMessage &&
    checkQuotedMessageEquality(prevQuotedMessage, nextQuotedMessage);
  if (!messageEqual) {
    return false;
  }

  return true;
};

export const MemoizedReply = React.memo(ReplyWithContext, areEqual) as typeof ReplyWithContext;

export type ReplyProps = Partial<ReplyPropsWithContext> &
  Pick<ReplyPropsWithContext, 'mode' | 'onDismiss'>;

export const Reply = (props: ReplyProps) => {
  const { message: messageFromContext } = useMessageContext();
  const { client, ImageComponent } = useChatContext();

  const messageComposer = useMessageComposer();
  const { quotedMessage: quotedMessageFromComposer } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );

  const quotedMessage = messageFromContext
    ? (messageFromContext.quoted_message as MessagesContextValue['quotedMessage'])
    : quotedMessageFromComposer;

  const isMyMessage = client.user?.id === quotedMessage?.user?.id;

  return (
    <MemoizedReply
      ImageComponent={ImageComponent}
      isMyMessage={isMyMessage}
      message={messageFromContext}
      quotedMessage={quotedMessage}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const messageComposer = useMessageComposer();
  const { quotedMessage: quotedMessageFromComposer } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );
  const { client } = useChatContext();

  const isMyMessage = client.user?.id === quotedMessageFromComposer?.user?.id;

  return useMemo(
    () =>
      StyleSheet.create({
        attachmentContainer: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
        container: {
          borderRadius: primitives.radiusLg,
          flexDirection: 'row',
          padding: primitives.spacingXs,
          backgroundColor: isMyMessage ? semantics.chatBgOutgoing : semantics.chatBgIncoming,
        },
        contentWrapper: {
          borderRadius: primitives.radiusMd,
          borderWidth: 1,
          height: 40,
          overflow: 'hidden',
          width: 40,
        },
        contentBorder: {
          borderColor: semantics.borderCoreOpacity10,
        },
        dismissWrapper: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
        iconStyle: {},
        leftContainer: {
          borderLeftWidth: 2,
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: primitives.spacingXs,
          borderLeftColor: isMyMessage
            ? semantics.chatReplyIndicatorOutgoing
            : semantics.chatReplyIndicatorIncoming,
          gap: primitives.spacingXxxs,
        },
        rightContainer: {},
        subtitle: {
          color: isMyMessage ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
          flexShrink: 1,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          includeFontPadding: false,
          lineHeight: primitives.typographyLineHeightTight,
        },
        titleContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingXxs,
        },
        title: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightSemiBold,
          includeFontPadding: false,
          lineHeight: 16,
        },
        wrapper: {
          padding: primitives.spacingXxs,
        },
      }),
    [isMyMessage, semantics],
  );
};
