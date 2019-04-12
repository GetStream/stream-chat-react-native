import React from 'react';
import { Image, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import giphyLogo from '../../assets/Poweredby_100px-White_VertText.png';
import { Card } from './Card';
import FileIcon from './FileIcon';

export class Attachment extends React.Component {
  static propTypes = {
    /** The attachment to render */
    attachment: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { attachment: a } = this.props;
    if (!a) {
      return null;
    }

    let type, extra;
    if (a.actions && a.actions.length > 0) {
      extra = 'actions';
    }
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
    } else {
      type = 'card';
      extra = 'no-image';
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

    if (a.type === 'giphy') {
      return <Card {...a} />;
    }

    if (a.type === 'file') {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#EBEBEB',
            padding: 10,
          }}
        >
          <FileIcon filename={a.title} mimeType={a.mime_type} size={50} />
          <View
            style={{ display: 'flex', flexDirection: 'column', padding: 10 }}
          >
            <Text ellipsizeMode="tail" numberOfLines={2}>
              {a.title}
            </Text>
            <Text>{a.file_size}</Text>
          </View>
        </View>
      );
    }

    return false;
  }
}
