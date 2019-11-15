import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

import PropTypes from 'prop-types';
import { Card } from './Card';
import { FileIcon } from './FileIcon';
import { AttachmentActions } from './AttachmentActions';
import { Gallery } from './Gallery';

import { withMessageContentContext } from '../context';

const FileContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #ebebeb;
  padding: 10px;
  border-radius: ${({ groupStyle }) => {
    if (groupStyle === 'middle' || groupStyle === 'bottom') return 0;

    return 16;
  }};
  border-bottom-left-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;

    return alignment === 'right' ? 16 : 2;
  }};
  border-bottom-right-radius: ${({ alignment, groupStyle }) => {
    if (groupStyle === 'top' || groupStyle === 'middle') return 0;

    return alignment === 'left' ? 16 : 2;
  }};
  ${({ theme }) => theme.message.file.container.css}
`;

const FileDetails = styled.View`
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  ${({ theme }) => theme.message.file.details.css}
`;

const FileTitle = styled.Text`
  font-weight: 700;
  ${({ theme }) => theme.message.file.title.css}
`;

const FileSize = styled.Text`
  ${({ theme }) => theme.message.file.size.css}
`;

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
          PropTypes.func,
        ]),
      };
      static defaultProps = {
        AttachmentFileIcon: FileIcon,
      };

      constructor(props) {
        super(props);
      }

      _goToURL = (url) => {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            console.log("Don't know how to open URI: " + url);
          }
        });
      };

      render() {
        const { attachment: a } = this.props;
        if (!a) {
          return null;
        }

        let type;

        if (a.type === 'giphy' || a.type === 'imgur') {
          type = 'card';
        } else if (a.type === 'image' && (a.title_link || a.og_scrape_url)) {
          type = 'card';
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

        const AttachmentFileIcon = this.props.AttachmentFileIcon;
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
        if (a.type === 'giphy' || type === 'card') {
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

        if (a.type === 'file') {
          return (
            <TouchableOpacity
              onPress={() => {
                this._goToURL(a.asset_url);
              }}
              onLongPress={this.props.onLongPress}
            >
              <FileContainer
                alignment={this.props.alignment}
                groupStyle={this.props.groupStyle}
              >
                <AttachmentFileIcon
                  filename={a.title}
                  mimeType={a.mime_type}
                  size={50}
                />
                <FileDetails>
                  <FileTitle ellipsizeMode="tail" numberOfLines={2}>
                    {a.title}
                  </FileTitle>
                  <FileSize>{a.file_size} KB</FileSize>
                </FileDetails>
              </FileContainer>
              {a.actions && a.actions.length > 0 && (
                <AttachmentActions
                  key={'key-actions-' + a.id}
                  {...a}
                  actionHandler={this.props.actionHandler}
                />
              )}
            </TouchableOpacity>
          );
        }

        if (a.type === 'video' && a.asset_url && a.image_url) {
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
