import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';

import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

import PropTypes from 'prop-types';
import { Card } from './Card';
import FileIcon from './FileIcon';
import { AttachmentActions } from './AttachmentActions';
import { Gallery } from './Gallery';

const FileContainer = styled.View`
  display: ${({ theme }) => theme.attachment.file.container.display};
  flex-direction: ${({ theme }) =>
    theme.attachment.file.container.flexDirection};
  align-items: ${({ theme }) => theme.attachment.file.container.alignItems};
  background-color: ${({ theme }) =>
    theme.attachment.file.container.backgroundColor};
  padding: ${({ theme }) => theme.attachment.file.container.padding}px;
  border-radius: ${({ theme }) => theme.attachment.file.container.borderRadius};
  border-bottom-left-radius: ${({ theme, alignment }) =>
    alignment === 'right' ? theme.attachment.file.container.borderRadius : 2};
  border-bottom-right-radius: ${({ theme, alignment }) =>
    alignment === 'left' ? theme.attachment.file.container.borderRadius : 2};
  ${({ theme }) => theme.attachment.file.container.extra}
`;

const FileDetails = styled.View`
  display: ${({ theme }) => theme.attachment.file.details.display};
  flex-direction: ${({ theme }) => theme.attachment.file.details.flexDirection};
  padding-left: ${({ theme }) => theme.attachment.file.details.paddingLeft}px;
  ${({ theme }) => theme.attachment.file.details.extra}
`;

const FileTitle = styled.Text`
  font-weight: ${({ theme }) => theme.attachment.file.title.fontWeight};
  ${({ theme }) => theme.attachment.file.title.extra}
`;

const FileSize = styled.Text`
  ${({ theme }) => theme.attachment.file.size.extra}
`;

/**
 * Attachment - The message attachment
 *
 * @example ./docs/Attachment.md
 * @extends PureComponent
 */
export const Attachment = themed(
  class Attachment extends React.PureComponent {
    static themePath = 'attachment';
    static propTypes = {
      /** The attachment to render */
      attachment: PropTypes.object.isRequired,
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
      const { theme, attachment: a } = this.props;
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

      if (type === 'image') {
        return <Gallery alignment={this.props.alignment} images={[a]} />;
      }
      if (a.type === 'giphy' || type === 'card') {
        if (a.actions && a.actions.length) {
          return (
            <View>
              <Card {...a} alignment={this.props.alignment} />
              <AttachmentActions
                key={'key-actions-' + a.id}
                {...a}
                actionHandler={this.props.actionHandler}
              />
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
          >
            <FileContainer theme={theme} alignment={this.props.alignment}>
              <FileIcon filename={a.title} mimeType={a.mime_type} size={50} />
              <FileDetails>
                <FileTitle theme={theme} ellipsizeMode="tail" numberOfLines={2}>
                  {a.title}
                </FileTitle>
                <FileSize theme={theme}>{a.file_size} KB</FileSize>
              </FileDetails>
            </FileContainer>
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
);
