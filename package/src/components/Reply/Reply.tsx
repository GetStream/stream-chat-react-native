import React, { useContext, useState } from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

import merge from 'lodash/merge';

import type { Attachment } from 'stream-chat';

import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import {
  MessageInputContext,
  MessageInputContextValue,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getResizedImageUrl } from '../../utils/getResizedImageUrl';
import { emojiRegex } from '../../utils/utils';

import { FileIcon as FileIconDefault } from '../Attachment/FileIcon';
import { VideoThumbnail } from '../Attachment/VideoThumbnail';
import { MessageAvatar as MessageAvatarDefault } from '../Message/MessageSimple/MessageAvatar';
import { MessageTextContainer } from '../Message/MessageSimple/MessageTextContainer';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  fileAttachmentContainer: { paddingLeft: 8, paddingVertical: 8 },
  imageAttachment: {
    borderRadius: 8,
    height: 32,
    marginLeft: 8,
    marginVertical: 8,
    width: 32,
  },
  messageContainer: {
    alignItems: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
  },
  text: { fontSize: 12 },
  textContainer: { maxWidth: undefined, paddingHorizontal: 8 },
  videoAttachment: {
    borderRadius: 8,
    height: 50,
    marginLeft: 8,
    marginVertical: 8,
    width: 50,
  },
});

type ReplyPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'quotedMessage'> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'FileAttachmentIcon' | 'MessageAvatar'> &
  Pick<TranslationContextValue, 't'> & {
    attachmentSize?: number;
    styles?: Partial<{
      container: ViewStyle;
      fileAttachmentContainer: ViewStyle;
      imageAttachment: ImageStyle;
      messageContainer: ViewStyle;
      textContainer: ViewStyle;
    }>;
  };

const getMessageType = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  lastAttachment: Attachment<StreamChatGenerics>,
) => {
  let messageType;

  const isLastAttachmentFile = lastAttachment.type === 'file' || lastAttachment.type === 'audio';

  const isLastAttachmentVideo = lastAttachment.type === 'video';

  const isLastAttachmentGiphy =
    lastAttachment?.type === 'giphy' || lastAttachment?.type === 'imgur';

  const isLastAttachmentImageOrGiphy =
    lastAttachment?.type === 'image' &&
    !lastAttachment?.title_link &&
    !lastAttachment?.og_scrape_url;

  const isLastAttachmentImage = lastAttachment?.image_url || lastAttachment?.thumb_url;

  if (isLastAttachmentFile) {
    messageType = 'file';
  } else if (isLastAttachmentVideo) {
    messageType = 'video';
  } else if (isLastAttachmentImageOrGiphy) {
    if (isLastAttachmentImage) messageType = 'image';
    else messageType = undefined;
  } else if (isLastAttachmentGiphy) messageType = 'giphy';
  else messageType = 'other';

  return messageType;
};

const ReplyWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReplyPropsWithContext<StreamChatGenerics>,
) => {
  const {
    FileAttachmentIcon,
    attachmentSize = 40,
    MessageAvatar,
    quotedMessage,
    styles: stylesProp = {},
    t,
  } = props;

  const [error, setError] = useState(false);

  const {
    theme: {
      colors: { blue_alice, border, grey, transparent, white },
      messageSimple: {
        content: { deletedText },
      },
      reply: {
        container,
        fileAttachmentContainer,
        imageAttachment,
        markdownStyles,
        messageContainer,
        textContainer,
      },
    },
  } = useTheme();

  if (typeof quotedMessage === 'boolean') return null;

  const lastAttachment = quotedMessage.attachments?.slice(-1)[0] as Attachment<StreamChatGenerics>;
  const messageType = lastAttachment && getMessageType(lastAttachment);

  const hasImage =
    !error &&
    lastAttachment &&
    messageType !== 'file' &&
    (lastAttachment.image_url || lastAttachment.thumb_url || lastAttachment.og_scrape_url);

  const onlyEmojis = !lastAttachment && !!quotedMessage.text && emojiRegex.test(quotedMessage.text);

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      <MessageAvatar alignment={'left'} lastGroupMessage message={quotedMessage} size={24} />
      <View
        style={[
          styles.messageContainer,
          {
            backgroundColor:
              messageType === 'other' ? blue_alice : messageType === 'giphy' ? transparent : white,
            borderColor: border,
            borderWidth: messageType === 'other' ? 0 : 1,
          },
          messageContainer,
          stylesProp.messageContainer,
        ]}
      >
        {!error && lastAttachment ? (
          messageType === 'file' ? (
            <View
              style={[
                styles.fileAttachmentContainer,
                fileAttachmentContainer,
                stylesProp.fileAttachmentContainer,
              ]}
            >
              <FileAttachmentIcon mimeType={lastAttachment.mime_type} size={attachmentSize} />
            </View>
          ) : hasImage ? (
            <Image
              onError={() => setError(true)}
              source={{
                uri: getResizedImageUrl({
                  height:
                    stylesProp.imageAttachment?.height ||
                    imageAttachment?.height ||
                    styles.imageAttachment.height,
                  url: (lastAttachment.image_url ||
                    lastAttachment.thumb_url ||
                    lastAttachment.og_scrape_url) as string,
                  width:
                    stylesProp.imageAttachment?.width ||
                    imageAttachment?.width ||
                    styles.imageAttachment.width,
                }),
              }}
              style={[styles.imageAttachment, imageAttachment, stylesProp.imageAttachment]}
            />
          ) : null
        ) : null}
        {messageType === 'video' && !lastAttachment.og_scrape_url ? (
          <VideoThumbnail style={[styles.videoAttachment]} />
        ) : null}
        <MessageTextContainer<StreamChatGenerics>
          markdownStyles={
            quotedMessage.deleted_at
              ? merge({ em: { color: grey } }, deletedText)
              : { text: styles.text, ...markdownStyles }
          }
          message={{
            ...quotedMessage,
            text: quotedMessage.deleted_at
              ? `_${t('Message deleted')}_`
              : quotedMessage.text
              ? quotedMessage.text.length > 170
                ? `${quotedMessage.text.slice(0, 170)}...`
                : quotedMessage.text
              : messageType === 'image'
              ? t('Photo')
              : messageType === 'video'
              ? t('Video')
              : messageType === 'file'
              ? lastAttachment?.title || ''
              : '',
          }}
          onlyEmojis={onlyEmojis}
          styles={{
            textContainer: [
              {
                marginRight:
                  hasImage || messageType === 'video'
                    ? Number(
                        stylesProp.imageAttachment?.height ||
                          imageAttachment.height ||
                          styles.imageAttachment.height,
                      ) +
                      Number(
                        stylesProp.imageAttachment?.marginLeft ||
                          imageAttachment.marginLeft ||
                          styles.imageAttachment.marginLeft,
                      )
                    : messageType === 'file'
                    ? attachmentSize +
                      Number(
                        stylesProp.fileAttachmentContainer?.paddingLeft ||
                          fileAttachmentContainer.paddingLeft ||
                          styles.fileAttachmentContainer.paddingLeft,
                      )
                    : undefined,
              },
              styles.textContainer,
              textContainer,
              stylesProp.textContainer,
            ],
          }}
        />
      </View>
    </View>
  );
};

/**
 * When a reply is rendered in a MessageSimple, it does
 * not have a MessageInputContext. As this is deliberate,
 * this function exists to avoid the error thrown when
 * using a context outside of its provider.
 * */
const useMessageInputContextIfAvailable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    MessageInputContext,
  ) as unknown as MessageInputContextValue<StreamChatGenerics>;

  return contextValue;
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ReplyPropsWithContext<StreamChatGenerics>,
  nextProps: ReplyPropsWithContext<StreamChatGenerics>,
) => {
  const { quotedMessage: prevQuotedMessage } = prevProps;
  const { quotedMessage: nextQuotedMessage } = nextProps;

  const quotedMessageEqual =
    !!prevQuotedMessage &&
    !!nextQuotedMessage &&
    typeof prevQuotedMessage !== 'boolean' &&
    typeof nextQuotedMessage !== 'boolean'
      ? prevQuotedMessage.id === nextQuotedMessage.id &&
        prevQuotedMessage.deleted_at === nextQuotedMessage.deleted_at
      : !!prevQuotedMessage === !!nextQuotedMessage;

  if (!quotedMessageEqual) return false;

  return true;
};

const MemoizedReply = React.memo(ReplyWithContext, areEqual) as typeof ReplyWithContext;

export type ReplyProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<ReplyPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for reply
 */
export const Reply = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ReplyProps<StreamChatGenerics>,
) => {
  const { message } = useMessageContext<StreamChatGenerics>();

  const { FileAttachmentIcon = FileIconDefault, MessageAvatar = MessageAvatarDefault } =
    useMessagesContext<StreamChatGenerics>();

  const { editing, quotedMessage } = useMessageInputContextIfAvailable<StreamChatGenerics>();

  const quotedEditingMessage = (
    typeof editing !== 'boolean' ? editing?.quoted_message || false : false
  ) as MessageInputContextValue<StreamChatGenerics>['quotedMessage'];

  const { t } = useTranslationContext();

  return (
    <MemoizedReply
      {...{
        FileAttachmentIcon,
        MessageAvatar,
        quotedMessage: message
          ? (message.quoted_message as MessageInputContextValue<StreamChatGenerics>['quotedMessage'])
          : quotedMessage || quotedEditingMessage,
        t,
      }}
      {...props}
    />
  );
};

Reply.displayName = 'Reply{reply}';
