import React, { useContext, useMemo, useState } from 'react';

import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';

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
import { getTrimmedAttachmentTitle } from '../../utils/getTrimmedAttachmentTitle';
import { hasOnlyEmojis } from '../../utils/utils';

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
  secondaryText: {
    paddingHorizontal: 8,
  },
  text: { fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  textContainer: { maxWidth: undefined, paddingHorizontal: 8 },
  videoThumbnailContainerStyle: {
    borderRadius: 8,
    height: 50,
    marginLeft: 8,
    marginVertical: 8,
    width: 50,
  },
  videoThumbnailImageStyle: {
    borderRadius: 10,
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

  const isLastAttachmentFile = lastAttachment.type === 'file';

  const isLastAttachmentAudio = lastAttachment.type === 'audio';

  const isLastAttachmentVoiceRecording = lastAttachment.type === 'voiceRecording';

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
  } else if (isLastAttachmentAudio) {
    messageType = 'audio';
  } else if (isLastAttachmentVoiceRecording) {
    messageType = 'voiceRecording';
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
    attachmentSize = 40,
    FileAttachmentIcon,
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
        secondaryText,
        textContainer,
        videoThumbnail: {
          container: videoThumbnailContainerStyle,
          image: videoThumbnailImageStyle,
        },
      },
    },
  } = useTheme();

  const messageText = typeof quotedMessage === 'boolean' ? '' : quotedMessage.text || '';

  const emojiOnlyText = useMemo(() => {
    if (!messageText) return false;
    return hasOnlyEmojis(messageText);
  }, [messageText]);

  if (typeof quotedMessage === 'boolean') return null;

  const lastAttachment = quotedMessage.attachments?.slice(-1)[0] as Attachment<StreamChatGenerics>;
  const messageType = lastAttachment && getMessageType(lastAttachment);

  const trimmedLastAttachmentTitle = getTrimmedAttachmentTitle(lastAttachment?.title);

  const hasImage =
    !error &&
    lastAttachment &&
    messageType !== 'file' &&
    messageType !== 'video' &&
    messageType !== 'audio' &&
    messageType !== 'voiceRecording' &&
    (lastAttachment.image_url || lastAttachment.thumb_url || lastAttachment.og_scrape_url);

  const onlyEmojis = !lastAttachment && emojiOnlyText;

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
          messageType === 'file' || messageType === 'voiceRecording' || messageType === 'audio' ? (
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
                    (stylesProp.imageAttachment?.height as number) ||
                    (imageAttachment?.height as number) ||
                    styles.imageAttachment.height,
                  url: (lastAttachment.image_url ||
                    lastAttachment.thumb_url ||
                    lastAttachment.og_scrape_url) as string,
                  width:
                    (stylesProp.imageAttachment?.width as number) ||
                    (imageAttachment?.width as number) ||
                    styles.imageAttachment.width,
                }),
              }}
              style={[styles.imageAttachment, imageAttachment, stylesProp.imageAttachment]}
            />
          ) : null
        ) : null}
        {messageType === 'video' && !lastAttachment.og_scrape_url ? (
          <VideoThumbnail
            imageStyle={[styles.videoThumbnailImageStyle, videoThumbnailImageStyle]}
            style={[styles.videoThumbnailContainerStyle, videoThumbnailContainerStyle]}
            thumb_url={lastAttachment.thumb_url}
          />
        ) : null}
        <View style={{ flexDirection: 'column' }}>
          <MessageTextContainer<StreamChatGenerics>
            markdownStyles={
              quotedMessage.type === 'deleted'
                ? merge({ em: { color: grey } }, deletedText)
                : { text: styles.text, ...markdownStyles }
            }
            message={{
              ...quotedMessage,
              text:
                quotedMessage.type === 'deleted'
                  ? `_${t('Message deleted')}_`
                  : quotedMessage.text
                  ? quotedMessage.text.length > 170
                    ? `${quotedMessage.text.slice(0, 170)}...`
                    : quotedMessage.text
                  : messageType === 'image'
                  ? t('Photo')
                  : messageType === 'video'
                  ? t('Video')
                  : messageType === 'file' ||
                    messageType === 'audio' ||
                    messageType === 'voiceRecording'
                  ? trimmedLastAttachmentTitle || ''
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
                      : messageType === 'file' ||
                        messageType === 'audio' ||
                        messageType === 'voiceRecording'
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
          {messageType === 'audio' || messageType === 'voiceRecording' ? (
            <Text style={[styles.secondaryText, { color: grey }, secondaryText]}>
              {lastAttachment.duration
                ? dayjs.duration(lastAttachment.duration, 'second').format('mm:ss')
                : ''}
            </Text>
          ) : null}
        </View>
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
        prevQuotedMessage.deleted_at === nextQuotedMessage.deleted_at &&
        prevQuotedMessage.type === nextQuotedMessage.type
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
