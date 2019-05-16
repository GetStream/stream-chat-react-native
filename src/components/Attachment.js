import React from 'react';
import { Image, Text, View, TouchableOpacity, Linking } from 'react-native';
import PropTypes from 'prop-types';
import { Card } from './Card';
import FileIcon from './FileIcon';
import { AttachmentActions } from './AttachmentActions';
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
      return (
        <Image
          source={{ uri: a.image_url || a.thumb_url }}
          resizeMethod="resize"
          style={{
            height: 200,
            width: 200,
          }}
        />
      );
    }

    if (a.type === 'giphy' || type === 'card') {
      if (a.actions && a.actions.length) {
        return (
          <View>
            <Card {...a} />
            <AttachmentActions
              key={'key-actions-' + a.id}
              {...a}
              actionHandler={this.props.actionHandler}
            />
          </View>
        );
      } else {
        return <Card {...a} />;
      }
    }

    if (a.type === 'file') {
      return (
        <TouchableOpacity
          onPress={() => {
            this._goToURL(a.asset_url);
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#EBEBEB',
              padding: 10,
              borderRadius: 16,
            }}
          >
            <FileIcon filename={a.title} mimeType={a.mime_type} size={50} />
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                paddingLeft: 10,
              }}
            >
              <Text
                ellipsizeMode="tail"
                numberOfLines={2}
                style={{ fontWeight: 'bold' }}
              >
                {a.title}
              </Text>
              <Text>{a.file_size} KB</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (a.type === 'video' && a.asset_url && a.image_url) {
      return (
        <TouchableOpacity
          onPress={() => {
            this._goToURL(a.asset_url);
          }}
        >
          <Image
            resizeMode="stretch"
            style={{
              height: 200,
              width: 250,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
            source={{ uri: a.image_url }}
          />
          <View
            style={{
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              backgroundColor: '#EBEBEB',
              padding: 10,
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
              }}
            >
              {a.title}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return false;
  }
}
