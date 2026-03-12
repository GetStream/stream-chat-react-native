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

import { AudioAttachment as AudioAttachmentDefault } from './Audio';

import { UnsupportedAttachment as UnsupportedAttachmentDefault } from './UnsupportedAttachment';
import { URLPreview as URLPreviewDefault } from './UrlPreview';
import { URLPreviewCompact as URLPreviewCompactDefault } from './UrlPreview/URLPreviewCompact';

import { FileAttachment as FileAttachmentDefault } from '../../components/Attachment/FileAttachment';
import { Gallery as GalleryDefault } from '../../components/Attachment/Gallery';
import { Giphy as GiphyDefault } from '../../components/Attachment/Giphy';

import { useTheme } from '../../contexts';
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
  | 'AudioAttachment'
  | 'FileAttachment'
  | 'Gallery'
  | 'Giphy'
  | 'isAttachmentEqual'
  | 'UrlPreview'
  | 'URLPreviewCompact'
  | 'myMessageTheme'
  | 'urlPreviewType'
  | 'UnsupportedAttachment'
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
  const {
    attachment,
    AudioAttachment,
    FileAttachment,
    Gallery,
    Giphy,
    UrlPreview,
    URLPreviewCompact,
    index,
    message,
    urlPreviewType,
    UnsupportedAttachment,
  } = props;
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
  const {
    attachment,
    AudioAttachment: PropAudioAttachment,
    FileAttachment: PropFileAttachment,
    Gallery: PropGallery,
    Giphy: PropGiphy,
    myMessageTheme: PropMyMessageTheme,
    UrlPreview: PropUrlPreview,
    URLPreviewCompact: PropURLPreviewCompact,
    urlPreviewType: PropUrlPreviewType,
    UnsupportedAttachment: PropUnsupportedAttachment,
  } = props;

  const {
    AudioAttachment: ContextAudioAttachment,
    FileAttachment: ContextFileAttachment,
    Gallery: ContextGallery,
    Giphy: ContextGiphy,
    isAttachmentEqual,
    myMessageTheme: ContextMyMessageTheme,
    UrlPreview: ContextUrlPreview,
    URLPreviewCompact: ContextURLPreviewCompact,
    urlPreviewType: ContextUrlPreviewType,
    UnsupportedAttachment: ContextUnsupportedAttachment,
  } = useMessagesContext();

  const { message } = useMessageContext();

  if (!attachment) {
    return null;
  }

  const AudioAttachment = PropAudioAttachment || ContextAudioAttachment || AudioAttachmentDefault;
  const FileAttachment = PropFileAttachment || ContextFileAttachment || FileAttachmentDefault;
  const Gallery = PropGallery || ContextGallery || GalleryDefault;
  const Giphy = PropGiphy || ContextGiphy || GiphyDefault;
  const UrlPreview = PropUrlPreview || ContextUrlPreview || URLPreviewDefault;
  const myMessageTheme = PropMyMessageTheme || ContextMyMessageTheme;
  const URLPreviewCompact =
    PropURLPreviewCompact || ContextURLPreviewCompact || URLPreviewCompactDefault;
  const urlPreviewType = PropUrlPreviewType || ContextUrlPreviewType;
  const UnsupportedAttachment =
    PropUnsupportedAttachment || ContextUnsupportedAttachment || UnsupportedAttachmentDefault;

  return (
    <MemoizedAttachment
      {...{
        attachment,
        message,
        AudioAttachment,
        FileAttachment,
        Gallery,
        Giphy,
        isAttachmentEqual,
        myMessageTheme,
        UrlPreview,
        URLPreviewCompact,
        urlPreviewType,
        UnsupportedAttachment,
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
