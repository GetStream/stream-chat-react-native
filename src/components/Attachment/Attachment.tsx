import React from 'react';
import { View } from 'react-native';
import type { Attachment as AttachmentType, UnknownType } from 'stream-chat';

import DefaultAttachmentActions, {
  AttachmentActionsProps,
} from './AttachmentActions';
import DefaultCard, { CardProps } from './Card';
import DefaultFileAttachment, { FileAttachmentProps } from './FileAttachment';
import DefaultFileIcon, { FileIconProps } from './FileIcon';
import DefaultGallery, { GalleryProps } from './Gallery';

import { themed } from '../../styles/theme';

import type { FileAttachmentGroupProps } from './FileAttachmentGroup';
import type { Alignment } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType } from '../../types/types';

export type ActionHandler =
  | ((name: string, value: string) => Promise<void>)
  | ((arg1: unknown, arg2: unknown) => unknown);

export type GroupStyle = 'single' | 'top' | 'middle' | 'bottom';

export type AttachmentProps<At extends UnknownType = DefaultAttachmentType> = {
  /**
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   */
  actionHandler: ActionHandler;
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * The attachment to render
   */
  attachment: AttachmentType<At>;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions?: React.ComponentType<Partial<AttachmentActionsProps>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon?: React.ComponentType<Partial<FileIconProps>>;
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Card?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
   */
  FileAttachment?: React.ComponentType<Partial<FileAttachmentProps<At>>>;
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
   */
  FileAttachmentGroup?: React.ComponentType<FileAttachmentGroupProps>;
  /**
   * Custom UI component to display image attachments.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
   */
  Gallery?: React.ComponentType<GalleryProps<At>>;
  /**
   * Custom UI component to display Giphy image.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Giphy?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyle?: GroupStyle;
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  UrlPreview?: React.ComponentType<Partial<CardProps<At>>>;
};

/**
 * Attachment - The message attachment
 *
 * @example ../docs/Attachment.md
 */
const Attachment = <At extends UnknownType = DefaultAttachmentType>(
  props: AttachmentProps<At> & { themePath?: string },
) => {
  const {
    actionHandler,
    alignment,
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

  const Giphy = props?.Giphy ? props.Giphy : Card;
  const UrlPreview = props?.UrlPreview ? props.UrlPreview : Card;
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

Attachment.themePath = 'attachment';

export default themed(Attachment) as typeof Attachment;
