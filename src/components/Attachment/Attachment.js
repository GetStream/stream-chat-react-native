import React, { useContext } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { MessageContentContext } from '../../context';
import { themed } from '../../styles/theme';

import AttachmentActions from './AttachmentActions';
import Card from './Card';
import FileAttachment from './FileAttachment';
import FileIcon from './FileIcon';
import Gallery from './Gallery';

/**
 * Attachment - The message attachment
 *
 * @example ../docs/Attachment.md
 */
const Attachment = (props) => {
  const {
    actionHandler,
    alignment,
    attachment,
    AttachmentActions,
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    FileAttachment,
    Gallery,
  } = props;

  if (!attachment) {
    return null;
  }

  const Giphy = props.Giphy || Card;
  const UrlPreview = props.UrlPreview || Card;
  const cardProps = {
    Header: CardHeader ? CardHeader : undefined,
    Cover: CardCover ? CardCover : undefined,
    Footer: CardFooter ? CardFooter : undefined,
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

  const hasAttachmentActions = attachment.actions && attachment.actions.length;
  if (type === 'image') {
    return (
      <>
        <Gallery alignment={alignment} images={[attachment]} />
        {hasAttachmentActions && (
          <AttachmentActions
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
          <Giphy alignment={alignment} {...attachment} {...cardProps} />
          <AttachmentActions
            actionHandler={actionHandler}
            key={`key-actions-${attachment.id}`}
            {...attachment}
          />
        </View>
      );
    } else {
      return <Giphy alignment={alignment} {...attachment} {...cardProps} />;
    }
  }

  if (type === 'card') {
    if (hasAttachmentActions) {
      return (
        <View>
          <Card alignment={alignment} {...attachment} {...cardProps} />
          <AttachmentActions
            actionHandler={actionHandler}
            key={`key-actions-${attachment.id}`}
            {...attachment}
          />
        </View>
      );
    } else {
      return <Card alignment={alignment} {...attachment} />;
    }
  }

  if (type === 'urlPreview') {
    return <UrlPreview alignment={alignment} {...attachment} {...cardProps} />;
  }

  if (type === 'file') {
    const { AttachmentFileIcon, groupStyle } = props;
    const { onLongPress } = useContext(MessageContentContext);

    return (
      <FileAttachment
        actionHandler={actionHandler}
        alignment={alignment}
        attachment={attachment}
        AttachmentFileIcon={AttachmentFileIcon}
        groupStyle={groupStyle}
        onLongPress={onLongPress}
      />
    );
  }

  if (type === 'media' && attachment.asset_url && attachment.image_url) {
    return (
      // TODO: Put in video component
      <Card alignment={alignment} {...attachment} {...cardProps} />
    );
  }

  return false;
};

Attachment.propTypes = {
  /** The attachment to render */
  attachment: PropTypes.object.isRequired,
  /**
   * Position of message. 'right' | 'left'
   * 'right' message belongs with current user while 'left' message belongs to other users.
   * */
  alignment: PropTypes.string,
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  actionHandler: PropTypes.func,
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyle: PropTypes.oneOf(['single', 'top', 'middle', 'bottom']),
  /** Handler for long press event on attachment */
  onLongPress: PropTypes.func,
  /**
   * Provide any additional props for child `TouchableOpacity`.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   */
  additionalTouchableProps: PropTypes.object,
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  UrlPreview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display Giphy image.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Giphy: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
   */
  FileAttachmentGroup: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
   */
  FileAttachment: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display image attachments.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
   */
  Gallery: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Card: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
};

Attachment.defaultProps = {
  AttachmentFileIcon: FileIcon,
  AttachmentActions,
  Gallery,
  Card,
  FileAttachment,
};

Attachment.themePath = 'attachment';

export default themed(Attachment);
