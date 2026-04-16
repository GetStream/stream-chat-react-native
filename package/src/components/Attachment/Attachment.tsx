import React, { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import {
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isVideoAttachment,
  isVoiceRecordingAttachment,
  type Attachment as AttachmentType,
} from 'stream-chat';

import { useTheme } from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { isSoundPackageAvailable, isVideoPlayerAvailable } from '../../native';

import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';

export type ActionHandler = (name: string, value: string) => void;

export type AttachmentPropsWithContext = Pick<
  MessagesContextValue,
  'isAttachmentEqual' | 'myMessageTheme' | 'urlPreviewType'
> &
  Pick<MessageContextValue, 'message'> & {
    /**
     * The attachment to render
     */
    attachment: AttachmentType;
    /**
     * The index of the attachment in the message
     */
    index?: number;
  };

const AttachmentWithContext = (props: AttachmentPropsWithContext) => {
  const { attachment, index, message, urlPreviewType } = props;
  const {
    AudioAttachment,
    FileAttachment,
    Gallery,
    Giphy,
    UrlPreview,
    URLPreviewCompact,
    UnsupportedAttachment,
  } = useComponentsContext();
  const audioAttachmentStyles = useAudioAttachmentStyles();

  if (attachment.type === FileTypes.Giphy || attachment.type === FileTypes.Imgur) {
    return <Giphy attachment={attachment} />;
  }

  if (attachment.og_scrape_url || attachment.title_link) {
    if (urlPreviewType === 'compact') {
      return <URLPreviewCompact attachment={attachment} />;
    }
    return <UrlPreview attachment={attachment} />;
  }

  if (isImageAttachment(attachment)) {
    return <Gallery images={[attachment]} />;
  }

  // The `!attachment.og_scrape_url` is added for cases, where the url preview is not an image but a video.
  if (isVideoAttachment(attachment) && !attachment.og_scrape_url) {
    return isVideoPlayerAvailable() ? (
      <Gallery videos={[attachment]} />
    ) : (
      <FileAttachment attachment={attachment} />
    );
  }

  if (isAudioAttachment(attachment) || isVoiceRecordingAttachment(attachment)) {
    if (isSoundPackageAvailable()) {
      return (
        <AudioAttachment
          item={{ ...attachment, id: index?.toString() ?? '', type: attachment.type }}
          message={message}
          showSpeedSettings={true}
          showTitle={false}
          styles={audioAttachmentStyles}
        />
      );
    }
    return <FileAttachment attachment={attachment} />;
  }

  if (isFileAttachment(attachment)) {
    return <FileAttachment attachment={attachment} />;
  }

  return <UnsupportedAttachment attachment={attachment} />;
};

const areEqual = (prevProps: AttachmentPropsWithContext, nextProps: AttachmentPropsWithContext) => {
  const {
    attachment: prevAttachment,
    isAttachmentEqual,
    myMessageTheme: prevMyMessageTheme,
  } = prevProps;
  const { attachment: nextAttachment, myMessageTheme: nextMyMessageTheme } = nextProps;

  const attachmentEqual =
    prevAttachment.actions?.length === nextAttachment.actions?.length &&
    prevAttachment.image_url === nextAttachment.image_url &&
    prevAttachment.thumb_url === nextAttachment.thumb_url &&
    prevAttachment.type === nextAttachment.type;
  if (!attachmentEqual) {
    return false;
  }

  if (isAttachmentEqual) {
    return isAttachmentEqual(prevAttachment, nextAttachment);
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedAttachment = React.memo(
  AttachmentWithContext,
  areEqual,
) as typeof AttachmentWithContext;

export type AttachmentProps = Partial<AttachmentPropsWithContext>;

/**
 * Attachment - The message attachment
 */
export const Attachment = (props: AttachmentProps) => {
  const { attachment } = props;

  const { isAttachmentEqual, myMessageTheme, urlPreviewType } = useMessagesContext();

  const { message } = useMessageContext();

  if (!attachment) {
    return null;
  }

  return (
    <MemoizedAttachment
      {...{
        attachment,
        isAttachmentEqual,
        message,
        myMessageTheme,
        urlPreviewType,
      }}
    />
  );
};

const useAudioAttachmentStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage, messageHasOnlySingleAttachment } = useMessageContext();

  const showBackgroundTransparent = messageHasOnlySingleAttachment;

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingVertical: primitives.spacingXs,
        paddingLeft: primitives.spacingXs,
        paddingRight: primitives.spacingSm,
        borderWidth: 0,
        backgroundColor: showBackgroundTransparent
          ? 'transparent'
          : isMyMessage
            ? semantics.chatBgAttachmentOutgoing
            : semantics.chatBgAttachmentIncoming,
      },
      playPauseButton: {
        borderColor: isMyMessage
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
      speedSettingsButton: {
        borderColor: isMyMessage
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
      durationText: {
        color: semantics.chatTextIncoming,
        fontWeight: primitives.typographyFontWeightSemiBold,
      },
    });
  }, [semantics, isMyMessage, showBackgroundTransparent]);
};
