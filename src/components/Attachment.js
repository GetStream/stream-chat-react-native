import React from 'react';
import { View } from 'react-native';

import { themed } from '../styles/theme';

import PropTypes from 'prop-types';
import { Card } from './Card';
import { FileIcon } from './FileIcon';
import { AttachmentActions } from './AttachmentActions';
import { Gallery } from './Gallery';

import { withMessageContentContext } from '../context';
import { FileAttachment } from './FileAttachment';

/**
 * Attachment - The message attachment
 *
 * @example ./docs/Attachment.md
 * @extends PureComponent
 */
export const Attachment = withMessageContentContext(
  themed(
    class Attachment extends React.PureComponent {
      static themePath = 'attachment';
      static propTypes = {
        /** The attachment to render */
        attachment: PropTypes.object.isRequired,
        /**
         * Position of message. 'right' | 'left'
         * 'right' message belongs with current user while 'left' message belonds to other users.
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
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
         */
        UrlPreview: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        /**
         * Custom UI component to display Giphy image.
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
         */
        Giphy: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        /**
         * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
         */
        FileAttachmentGroup: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        /**
         * Custom UI component to display File type attachment.
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
         */
        FileAttachment: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
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
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
         */
        Gallery: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        /**
         * Custom UI component to display generic media type e.g. giphy, url preview etc
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
         */
        Card: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        /**
         * Custom UI component to override default header of Card component.
         * Accepts the same props as Card component.
         */
        CardHeader: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        /**
         * Custom UI component to override default cover (between Header and Footer) of Card component.
         * Accepts the same props as Card component.
         */
        CardCover: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        /**
         * Custom UI component to override default Footer of Card component.
         * Accepts the same props as Card component.
         */
        CardFooter: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        /**
         * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
         * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
         */
        AttachmentActions: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
      };
      static defaultProps = {
        AttachmentFileIcon: FileIcon,
        AttachmentActions,
        Gallery,
        Card,
        FileAttachment,
      };

      constructor(props) {
        super(props);
      }

      render() {
        const {
          attachment: a,
          Gallery,
          Card,
          CardHeader,
          CardCover,
          CardFooter,
          FileAttachment,
          AttachmentActions,
        } = this.props;
        if (!a) {
          return null;
        }

        const Giphy = this.props.Giphy ? this.props.Giphy : Card;
        const UrlPreview = this.props.UrlPreview ? this.props.UrlPreview : Card;

        const cardProps = {
          Header: CardHeader ? CardHeader : undefined,
          Cover: CardCover ? CardCover : undefined,
          Footer: CardFooter ? CardFooter : undefined,
        };
        let type;

        if (a.type === 'giphy' || a.type === 'imgur') {
          type = 'giphy';
        } else if (
          (a.title_link || a.og_scrape_url) &&
          (a.image_url || a.thumb_url)
        ) {
          type = 'urlPreview';
        } else if (a.type === 'image') {
          type = 'image';
        } else if (a.type === 'file') {
          type = 'file';
        } else if (a.type === 'audio') {
          type = 'audio';
        } else if (a.type === 'video') {
          type = 'media';
        } else if (a.type === 'product') {
          type = 'product';
        } else {
          type = 'card';
          // extra = 'no-image';
        }

        if (type === 'image') {
          return (
            <React.Fragment>
              <Gallery alignment={this.props.alignment} images={[a]} />
              {a.actions && a.actions.length > 0 && (
                <AttachmentActions
                  key={'key-actions-' + a.id}
                  {...a}
                  actionHandler={this.props.actionHandler}
                />
              )}
            </React.Fragment>
          );
        }
        if (type === 'giphy') {
          if (a.actions && a.actions.length) {
            return (
              <View>
                <Giphy {...a} alignment={this.props.alignment} {...cardProps} />
                {a.actions && a.actions.length > 0 && (
                  <AttachmentActions
                    key={'key-actions-' + a.id}
                    {...a}
                    actionHandler={this.props.actionHandler}
                  />
                )}
              </View>
            );
          } else {
            return (
              <Giphy alignment={this.props.alignment} {...a} {...cardProps} />
            );
          }
        }
        if (type === 'card') {
          if (a.actions && a.actions.length) {
            return (
              <View>
                <Card {...a} alignment={this.props.alignment} {...cardProps} />
                {a.actions && a.actions.length > 0 && (
                  <AttachmentActions
                    key={'key-actions-' + a.id}
                    {...a}
                    actionHandler={this.props.actionHandler}
                  />
                )}
              </View>
            );
          } else {
            return <Card alignment={this.props.alignment} {...a} />;
          }
        }

        if (type === 'urlPreview') {
          return (
            <UrlPreview
              alignment={this.props.alignment}
              {...a}
              {...cardProps}
            />
          );
        }

        if (type === 'file') {
          const {
            AttachmentFileIcon,
            actionHandler,
            onLongPress,
            alignment,
            groupStyle,
          } = this.props;

          return (
            <FileAttachment
              attachment={a}
              actionHandler={actionHandler}
              AttachmentFileIcon={AttachmentFileIcon}
              onLongPress={onLongPress}
              alignment={alignment}
              groupStyle={groupStyle}
            />
          );
        }

        if (type === 'media' && a.asset_url && a.image_url) {
          return (
            // TODO: Put in video component
            <Card alignment={this.props.alignment} {...a} {...cardProps} />
          );
        }

        return false;
      }
    },
  ),
);
