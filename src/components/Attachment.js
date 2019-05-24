import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { getTheme } from '../styles/theme';

import styled from 'styled-components';

import PropTypes from 'prop-types';
import { Card } from './Card';
import FileIcon from './FileIcon';
import { AttachmentActions } from './AttachmentActions';
import { Gallery } from './Gallery';

const FileContainer = styled.View`
  display: ${(props) => getTheme(props).attachment.file.container.display};
  flex-direction: ${(props) =>
    getTheme(props).attachment.file.container.flexDirection};
  align-items: ${(props) =>
    getTheme(props).attachment.file.container.alignItems};
  background-color: ${(props) =>
    getTheme(props).attachment.file.container.backgroundColor};
  padding: ${(props) => getTheme(props).attachment.file.container.padding}px;
  border-radius: ${(props) =>
    getTheme(props).attachment.file.container.borderRadius};
  border-bottom-left-radius: ${(props) =>
    props.alignment === 'right'
      ? getTheme(props).attachment.file.container.borderRadius
      : 2};
  border-bottom-right-radius: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).attachment.file.container.borderRadius
      : 2};
`;

const FileDetails = styled.View`
  display: ${(props) => getTheme(props).attachment.file.details.display};
  flex-direction: ${(props) =>
    getTheme(props).attachment.file.details.flexDirection};
  padding-left: ${(props) =>
    getTheme(props).attachment.file.details.paddingLeft}px;
`;

const FileTitle = styled.Text`
  font-weight: ${(props) => getTheme(props).attachment.file.title.fontWeight};
`;

const FileSize = styled.Text``;

export class Attachment extends React.Component {
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
          <FileContainer alignment={this.props.alignment}>
            <FileIcon filename={a.title} mimeType={a.mime_type} size={50} />
            <FileDetails>
              <FileTitle ellipsizeMode="tail" numberOfLines={2}>
                {a.title}
              </FileTitle>
              <FileSize>{a.file_size} KB</FileSize>
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
}
