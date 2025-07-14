import React, { useMemo, useState } from 'react';

import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';

import merge from 'lodash/merge';

import type { Attachment, MessageComposerState, PollState } from 'stream-chat';

import { useChatContext, useMessageComposer } from '../../contexts';
import { useChatConfigContext } from '../../contexts/chatConfigContext/ChatConfigContext';
import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks';
import { FileTypes } from '../../types/types';
import { getResizedImageUrl } from '../../utils/getResizedImageUrl';
import { getTrimmedAttachmentTitle } from '../../utils/getTrimmedAttachmentTitle';
import { checkQuotedMessageEquality, hasOnlyEmojis } from '../../utils/utils';

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

export type ReplySelectorReturnType = {
  name?: string;
};

const selector = (nextValue: PollState): ReplySelectorReturnType => ({
  name: nextValue.name,
});

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

type ReplyPropsWithContext = Pick<
  MessagesContextValue,
  'FileAttachmentIcon' | 'MessageAvatar' | 'quotedMessage'
> &
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

const getMessageType = (lastAttachment: Attachment) => {
  let messageType;

  const isLastAttachmentFile = lastAttachment.type === FileTypes.File;

  const isLastAttachmentAudio = lastAttachment.type === FileTypes.Audio;

  const isLastAttachmentVoiceRecording = lastAttachment.type === FileTypes.VoiceRecording;

  const isLastAttachmentVideo = lastAttachment.type === FileTypes.Video;

  const isLastAttachmentGiphy =
    lastAttachment?.type === FileTypes.Giphy || lastAttachment?.type === FileTypes.Imgur;

  const isLastAttachmentImageOrGiphy =
    lastAttachment?.type === FileTypes.Image &&
    !lastAttachment?.title_link &&
    !lastAttachment?.og_scrape_url;

  const isLastAttachmentImage = lastAttachment?.image_url || lastAttachment?.thumb_url;

  if (isLastAttachmentFile) {
    messageType = FileTypes.File;
  } else if (isLastAttachmentVideo) {
    messageType = FileTypes.Video;
  } else if (isLastAttachmentAudio) {
    messageType = FileTypes.Audio;
  } else if (isLastAttachmentVoiceRecording) {
    messageType = FileTypes.VoiceRecording;
  } else if (isLastAttachmentImageOrGiphy) {
    if (isLastAttachmentImage) {
      messageType = FileTypes.Image;
    } else {
      messageType = undefined;
    }
  } else if (isLastAttachmentGiphy) {
    messageType = FileTypes.Giphy;
  } else {
    messageType = 'other';
  }

  return messageType;
};

const ReplyWithContext = (props: ReplyPropsWithContext) => {
  const { client } = useChatContext();
  const {
    attachmentSize = 40,
    FileAttachmentIcon,
    MessageAvatar,
    quotedMessage,
    styles: stylesProp = {},
    t,
  } = props;

  const { resizableCDNHosts } = useChatConfigContext();

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

  const poll = client.polls.fromState(quotedMessage?.poll_id ?? '');
  const { name: pollName }: ReplySelectorReturnType = useStateStore(poll?.state, selector) ?? {};

  const messageText = quotedMessage ? quotedMessage.text : '';

  const emojiOnlyText = useMemo(() => {
    if (!messageText) {
      return false;
    }
    return hasOnlyEmojis(messageText);
  }, [messageText]);

  if (!quotedMessage) {
    return null;
  }

  const lastAttachment = quotedMessage.attachments?.slice(-1)[0] as Attachment;
  const messageType = lastAttachment && getMessageType(lastAttachment);

  const trimmedLastAttachmentTitle = getTrimmedAttachmentTitle(lastAttachment?.title);

  const hasImage =
    !error &&
    lastAttachment &&
    messageType !== FileTypes.File &&
    messageType !== FileTypes.Video &&
    messageType !== FileTypes.Audio &&
    messageType !== FileTypes.VoiceRecording &&
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
          messageType === FileTypes.File ||
          messageType === FileTypes.Audio ||
          messageType === FileTypes.VoiceRecording ? (
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
                  resizableCDNHosts,
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
        {messageType === FileTypes.Video && !lastAttachment.og_scrape_url ? (
          <VideoThumbnail
            imageStyle={[styles.videoThumbnailImageStyle, videoThumbnailImageStyle]}
            style={[styles.videoThumbnailContainerStyle, videoThumbnailContainerStyle]}
            thumb_url={lastAttachment.thumb_url}
          />
        ) : null}
        <View style={{ flexDirection: 'column' }}>
          <MessageTextContainer
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
                  : pollName
                    ? `📊 ${pollName}`
                    : quotedMessage.text
                      ? quotedMessage.text.length > 170
                        ? `${quotedMessage.text.slice(0, 170)}...`
                        : quotedMessage.text
                      : messageType === FileTypes.Image
                        ? t('Photo')
                        : messageType === FileTypes.Video
                          ? t('Video')
                          : messageType === FileTypes.File ||
                              messageType === FileTypes.Audio ||
                              messageType === FileTypes.VoiceRecording
                            ? trimmedLastAttachmentTitle || ''
                            : '',
            }}
            onlyEmojis={onlyEmojis}
            styles={{
              textContainer: [
                {
                  marginRight:
                    hasImage || messageType === FileTypes.Video
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
                      : messageType === FileTypes.File ||
                          messageType === FileTypes.Audio ||
                          messageType === FileTypes.VoiceRecording
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
          {messageType === FileTypes.Audio || messageType === FileTypes.VoiceRecording ? (
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

const areEqual = (prevProps: ReplyPropsWithContext, nextProps: ReplyPropsWithContext) => {
  const { quotedMessage: prevQuotedMessage } = prevProps;
  const { quotedMessage: nextQuotedMessage } = nextProps;

  const quotedMessageEqual =
    !!prevQuotedMessage &&
    !!nextQuotedMessage &&
    checkQuotedMessageEquality(prevQuotedMessage, nextQuotedMessage);

  const quotedMessageAttachmentsEqual =
    prevQuotedMessage?.attachments?.length === nextQuotedMessage?.attachments?.length;

  if (!quotedMessageAttachmentsEqual) {
    return false;
  }

  if (!quotedMessageEqual) {
    return false;
  }

  return true;
};

const MemoizedReply = React.memo(ReplyWithContext, areEqual) as typeof ReplyWithContext;

export type ReplyProps = Partial<ReplyPropsWithContext>;

/**
 * UI Component for reply
 */
export const Reply = (props: ReplyProps) => {
  const { message } = useMessageContext();

  const { FileAttachmentIcon = FileIconDefault, MessageAvatar = MessageAvatarDefault } =
    useMessagesContext();

  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);

  const { t } = useTranslationContext();

  return (
    <MemoizedReply
      {...{
        FileAttachmentIcon,
        MessageAvatar,
        quotedMessage: message
          ? (message.quoted_message as MessagesContextValue['quotedMessage'])
          : quotedMessage,
        t,
      }}
      {...props}
    />
  );
};

Reply.displayName = 'Reply{reply}';
