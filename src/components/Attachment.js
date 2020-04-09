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
         * Custom UI component for attachment icon for type 'file' attachment.
         * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
         */
        AttachmentFileIcon: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        UrlPreview: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        Giphy: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        FileAttachment: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
        Gallery: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        Card: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
        AttachmentActions: PropTypes.oneOfType([
          PropTypes.node,
          PropTypes.elementType,
        ]),
      };
      static defaultProps = {
        AttachmentFileIcon: FileIcon,
        UrlPreview: Card,
        Giphy: Card,
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
          Giphy,
          Gallery,
          UrlPreview,
          Card,
          FileAttachment,
          AttachmentActions,
        } = this.props;
        if (!a) {
          return null;
        }

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
                <Giphy {...a} alignment={this.props.alignment} />
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
            return <Giphy alignment={this.props.alignment} {...a} />;
          }
        }
        if (type === 'card') {
          if (a.actions && a.actions.length) {
            return (
              <View>
                <Card {...a} alignment={this.props.alignment} />
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
          return <UrlPreview alignment={this.props.alignment} {...a} />;
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
            <Card alignment={this.props.alignment} {...a} />
          );
        }

        return false;
      }
    },
  ),
);
