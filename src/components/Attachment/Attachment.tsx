import React from 'react';
import { View } from 'react-native';

import DefaultAttachmentActions, {
  AttachmentActionsProps,
} from './AttachmentActions';
import DefaultCard, { CardProps } from './Card';
import DefaultFileAttachment, { FileAttachmentProps } from './FileAttachment';
import DefaultFileIcon, { FileIconProps } from './FileIcon';
import DefaultGallery, { GalleryProps } from './Gallery';

import type { Attachment as AttachmentType } from 'stream-chat';

import type { FileAttachmentGroupProps } from './FileAttachmentGroup';
import type {
  Alignment,
  GroupType,
} from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

export type ActionHandler =
  | ((name: string, value: string) => Promise<void>)
  | ((arg1: unknown, arg2: unknown) => unknown);

export type AttachmentProps<At extends UnknownType = DefaultAttachmentType> = {
  /**
   * The attachment to render
   */
  attachment: AttachmentType<At>;
  /**
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   */
  actionHandler?: ActionHandler;
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment?: Alignment;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/AttachmentActions.tsx
   */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps<At>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  Card?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachment.tsx
   */
  FileAttachment?: React.ComponentType<FileAttachmentProps<At>>;
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachmentGroup.tsx
   */
  FileAttachmentGroup?: React.ComponentType<FileAttachmentGroupProps<At>>;
  /**
   * Custom UI component to display image attachments.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Gallery.tsx
   */
  Gallery?: React.ComponentType<GalleryProps<At>>;
  /**
   * Custom UI component to display Giphy image.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  Giphy?: React.ComponentType<CardProps<At>>;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyle?: GroupType;
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  UrlPreview?: React.ComponentType<CardProps<At>>;
};

/**
 * Attachment - The message attachment
 *
 * @example ./Attachment.md
 */
const Attachment = <At extends UnknownType = DefaultAttachmentType>(
  props: AttachmentProps<At>,
) => {
  const {
    actionHandler,
    alignment = 'right',
    attachment,
    AttachmentActions = DefaultAttachmentActions,
    AttachmentFileIcon = DefaultFileIcon,
    Card = DefaultCard,
    CardCover,
    CardFooter,
    CardHeader,
    FileAttachment = DefaultFileAttachment,
    Gallery = DefaultGallery,
    groupStyle,
  } = props;

  if (!attachment) {
    return null;
  }

  const Giphy = props?.Giphy || Card;
  const UrlPreview = props?.UrlPreview || Card;
  const cardProps = {
    Cover: CardCover ? CardCover : undefined,
    Footer: CardFooter ? CardFooter : undefined,
    Header: CardHeader ? CardHeader : undefined,
  };

  let type;

  if (attachment.type === 'giphy' || attachment.type === 'imgur') {
    type = 'giphy';
  } else if (
    (attachment.title_link || attachment.og_scrape_url) &&
    (attachment.image_url || attachment.thumb_url)
  ) {
    type = 'urlPreview';
  } else if (attachment.type === 'image') {
    type = 'image';
  } else if (attachment.type === 'file' || attachment.type === 'audio') {
    type = 'file';
  } else if (attachment.type === 'video') {
    type = 'media';
  } else {
    type = 'card';
  }

  const hasAttachmentActions = !!attachment.actions?.length;

  if (type === 'image') {
    return (
      <>
        <Gallery<At> alignment={alignment} images={[attachment]} />
        {hasAttachmentActions && (
          <AttachmentActions<At>
            actionHandler={actionHandler}
            key={`key-actions-${attachment.id}`}
            {...attachment}
          />
        )}
      </>
    );
  }

  if (type === 'giphy') {
    if (hasAttachmentActions) {
      return (
        <View>
          <Giphy<At> alignment={alignment} {...attachment} {...cardProps} />
          <AttachmentActions<At>
            actionHandler={actionHandler}
            key={`key-actions-${attachment.id}`}
            {...attachment}
          />
        </View>
      );
    } else {
      return <Giphy<At> alignment={alignment} {...attachment} {...cardProps} />;
    }
  }

  if (type === 'card') {
    if (hasAttachmentActions) {
      return (
        <View>
          <Card<At> alignment={alignment} {...attachment} {...cardProps} />
          <AttachmentActions<At>
            actionHandler={actionHandler}
            key={`key-actions-${attachment.id}`}
            {...attachment}
          />
        </View>
      );
    } else {
      return <Card<At> alignment={alignment} {...attachment} />;
    }
  }

  if (type === 'urlPreview') {
    return (
      <UrlPreview<At> alignment={alignment} {...attachment} {...cardProps} />
    );
  }

  if (type === 'file') {
    return (
      <FileAttachment<At>
        actionHandler={actionHandler}
        alignment={alignment}
        attachment={attachment}
        AttachmentActions={AttachmentActions}
        AttachmentFileIcon={AttachmentFileIcon}
        groupStyle={groupStyle}
      />
    );
  }

  if (type === 'media' && attachment.asset_url && attachment.image_url) {
    return (
      // TODO: Put in video component
      <Card<At> alignment={alignment} {...attachment} {...cardProps} />
    );
  }

  return null;
};

export default Attachment;
