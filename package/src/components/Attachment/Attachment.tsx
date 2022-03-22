import React from 'react';

import type { Attachment as AttachmentType } from 'stream-chat';

import { AttachmentActions as AttachmentActionsDefault } from '../../components/Attachment/AttachmentActions';
import { Card as CardDefault } from '../../components/Attachment/Card';
import { FileAttachment as FileAttachmentDefault } from '../../components/Attachment/FileAttachment';
import { Gallery as GalleryDefault } from '../../components/Attachment/Gallery';
import { Giphy as GiphyDefault } from '../../components/Attachment/Giphy';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ActionHandler = (name: string, value: string) => void;

export type AttachmentPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessagesContextValue<StreamChatGenerics>,
  | 'AttachmentActions'
  | 'Card'
  | 'FileAttachment'
  | 'Gallery'
  | 'giphyVersion'
  | 'Giphy'
  | 'isAttachmentEqual'
  | 'UrlPreview'
> & {
  /**
   * The attachment to render
   */
  attachment: AttachmentType<StreamChatGenerics>;
};

const AttachmentWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachmentPropsWithContext<StreamChatGenerics>,
) => {
  const {
    attachment,
    AttachmentActions,
    Card,
    FileAttachment,
    Gallery,
    Giphy,
    giphyVersion,
    UrlPreview,
  } = props;

  const hasAttachmentActions = !!attachment.actions?.length;

  if (attachment.type === 'giphy' || attachment.type === 'imgur') {
    return <Giphy attachment={attachment} giphyVersion={giphyVersion} />;
  }

  if (
    (attachment.title_link || attachment.og_scrape_url) &&
    (attachment.image_url || attachment.thumb_url)
  ) {
    return <UrlPreview {...attachment} />;
  }

  if (attachment.type === 'image') {
    return (
      <>
        <Gallery images={[attachment]} />
        {hasAttachmentActions && (
          <AttachmentActions key={`key-actions-${attachment.id}`} {...attachment} />
        )}
      </>
    );
  }

  if (attachment.type === 'file' || attachment.type === 'audio') {
    return <FileAttachment attachment={attachment} />;
  }

  if (attachment.type === 'video' && attachment.asset_url) {
    return (
      // TODO: Put in video component
      <FileAttachment attachment={attachment} />
    );
  }

  if (hasAttachmentActions) {
    return (
      <>
        <Card {...attachment} />
        <AttachmentActions key={`key-actions-${attachment.id}`} {...attachment} />
      </>
    );
  } else {
    return <Card {...attachment} />;
  }
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AttachmentPropsWithContext<StreamChatGenerics>,
  nextProps: AttachmentPropsWithContext<StreamChatGenerics>,
) => {
  const { attachment: prevAttachment, isAttachmentEqual } = prevProps;
  const { attachment: nextAttachment } = nextProps;

  const attachmentEqual =
    prevAttachment.actions?.length === nextAttachment.actions?.length &&
    prevAttachment.image_url === nextAttachment.image_url &&
    prevAttachment.thumb_url === nextAttachment.thumb_url;
  if (!attachmentEqual) return false;

  if (isAttachmentEqual) {
    return isAttachmentEqual(prevAttachment, nextAttachment);
  }

  return true;
};

const MemoizedAttachment = React.memo(
  AttachmentWithContext,
  areEqual,
) as typeof AttachmentWithContext;

export type AttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'AttachmentActions'
    | 'Card'
    | 'FileAttachment'
    | 'Gallery'
    | 'Giphy'
    | 'giphyVersion'
    | 'UrlPreview'
    | 'isAttachmentEqual'
  >
> &
  Pick<AttachmentPropsWithContext<StreamChatGenerics>, 'attachment'>;

/**
 * Attachment - The message attachment
 */
export const Attachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachmentProps<StreamChatGenerics>,
) => {
  const {
    attachment,
    AttachmentActions: PropAttachmentActions,
    Card: PropCard,
    FileAttachment: PropFileAttachment,
    Gallery: PropGallery,
    Giphy: PropGiphy,
    giphyVersion: PropGiphyVersion,
    UrlPreview: PropUrlPreview,
  } = props;

  const {
    AttachmentActions: ContextAttachmentActions,
    Card: ContextCard,
    FileAttachment: ContextFileAttachment,
    Gallery: ContextGallery,
    Giphy: ContextGiphy,
    giphyVersion: ContextGiphyVersion,
    isAttachmentEqual,
    UrlPreview: ContextUrlPreview,
  } = useMessagesContext<StreamChatGenerics>();

  if (!attachment) {
    return null;
  }

  const AttachmentActions =
    PropAttachmentActions || ContextAttachmentActions || AttachmentActionsDefault;
  const Card = PropCard || ContextCard || CardDefault;
  const FileAttachment = PropFileAttachment || ContextFileAttachment || FileAttachmentDefault;
  const Gallery = PropGallery || ContextGallery || GalleryDefault;
  const Giphy = PropGiphy || ContextGiphy || GiphyDefault;
  const UrlPreview = PropUrlPreview || ContextUrlPreview || CardDefault;
  const giphyVersion = PropGiphyVersion || ContextGiphyVersion;

  return (
    <MemoizedAttachment
      {...{
        attachment,
        AttachmentActions,
        Card,
        FileAttachment,
        Gallery,
        Giphy,
        giphyVersion,
        isAttachmentEqual,
        UrlPreview,
      }}
    />
  );
};
