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

import { AudioAttachment as AudioAttachmentDefault } from './AudioAttachment';

import { AttachmentActions as AttachmentActionsDefault } from '../../components/Attachment/AttachmentActions';
import { Card as CardDefault } from '../../components/Attachment/Card';
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
  | 'AttachmentActions'
  | 'Card'
  | 'FileAttachment'
  | 'Gallery'
  | 'Giphy'
  | 'isAttachmentEqual'
  | 'UrlPreview'
  | 'myMessageTheme'
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
    AttachmentActions,
    Card,
    FileAttachment,
    Gallery,
    Giphy,
    UrlPreview,
    index,
    message,
  } = props;
  const audioAttachmentStyles = useAudioAttachmentStyles();

  const hasAttachmentActions = !!attachment.actions?.length;

  if (attachment.type === FileTypes.Giphy || attachment.type === FileTypes.Imgur) {
    return <Giphy attachment={attachment} />;
  }

  if (attachment.og_scrape_url || attachment.title_link) {
    return <UrlPreview attachment={attachment} />;
  }

  if (isImageAttachment(attachment)) {
    return (
      <>
        <Gallery images={[attachment]} />
        {hasAttachmentActions && (
          <AttachmentActions key={`key-actions-${attachment.image_url}`} {...attachment} />
        )}
      </>
    );
  }

  // The `!attachment.og_scrape_url` is added for cases, where the url preview is not an image but a video.
  if (isVideoAttachment(attachment) && !attachment.og_scrape_url) {
    return isVideoPlayerAvailable() ? (
      <>
        <Gallery videos={[attachment]} />
        {hasAttachmentActions && (
          <AttachmentActions key={`key-actions-${attachment.thumb_url}`} {...attachment} />
        )}
      </>
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

  if (hasAttachmentActions) {
    return (
      <>
        <Card attachment={attachment} />
        {/** TODO: Please rethink this, the fix is temporary. */}
        <AttachmentActions key={`key-actions-${attachment.image_url}`} {...attachment} />
      </>
    );
  } else {
    return <Card attachment={attachment} />;
  }
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
    AttachmentActions: PropAttachmentActions,
    Card: PropCard,
    FileAttachment: PropFileAttachment,
    Gallery: PropGallery,
    Giphy: PropGiphy,
    myMessageTheme: PropMyMessageTheme,
    UrlPreview: PropUrlPreview,
  } = props;

  const {
    AudioAttachment: ContextAudioAttachment,
    AttachmentActions: ContextAttachmentActions,
    Card: ContextCard,
    FileAttachment: ContextFileAttachment,
    Gallery: ContextGallery,
    Giphy: ContextGiphy,
    isAttachmentEqual,
    myMessageTheme: ContextMyMessageTheme,
    UrlPreview: ContextUrlPreview,
  } = useMessagesContext();

  const { message } = useMessageContext();

  if (!attachment) {
    return null;
  }

  const AudioAttachment = PropAudioAttachment || ContextAudioAttachment || AudioAttachmentDefault;
  const AttachmentActions =
    PropAttachmentActions || ContextAttachmentActions || AttachmentActionsDefault;
  const Card = PropCard || ContextCard || CardDefault;
  const FileAttachment = PropFileAttachment || ContextFileAttachment || FileAttachmentDefault;
  const Gallery = PropGallery || ContextGallery || GalleryDefault;
  const Giphy = PropGiphy || ContextGiphy || GiphyDefault;
  const UrlPreview = PropUrlPreview || ContextUrlPreview || CardDefault;
  const myMessageTheme = PropMyMessageTheme || ContextMyMessageTheme;

  return (
    <MemoizedAttachment
      {...{
        attachment,
        message,
        AttachmentActions,
        AudioAttachment,
        Card,
        FileAttachment,
        Gallery,
        Giphy,
        isAttachmentEqual,
        myMessageTheme,
        UrlPreview,
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
