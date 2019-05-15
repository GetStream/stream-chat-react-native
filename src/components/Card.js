import React from 'react';
import { Image, Text, View, TouchableOpacity, Linking } from 'react-native';
import PropTypes from 'prop-types';
import giphyLogo from '../assets/Poweredby_100px-White_VertText.png';
import { styles } from '../styles/styles.js';

export class Card extends React.Component {
  static propTypes = {
    /** Title retured by the OG scraper */
    title: PropTypes.string.isRequired,
    /** Link retured by the OG scraper */
    title_link: PropTypes.string,
    /** The scraped url, used as a fallback if the OG-data doesnt include a link */
    og_scrape_url: PropTypes.string,
    /** The url of the full sized image */
    image_url: PropTypes.string,
    /** The url for thumbnail sized image*/
    thumb_url: PropTypes.string,
    /** Description retured by the OG scraper */
    text: PropTypes.string,
  };

  constructor(props) {
    super(props);
  }

  trimUrl = (url) => {
    let trimmedUrl;
    if (url !== undefined || url !== null) {
      trimmedUrl = url
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0];
    }
    return trimmedUrl;
  };

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
    const {
      image_url,
      thumb_url,
      title,
      title_link,
      og_scrape_url,
      type,
    } = this.props;
    return (
      <TouchableOpacity
        onPress={() => {
          this._goToURL(og_scrape_url || image_url || thumb_url);
        }}
      >
        <Image
          source={{ uri: image_url || thumb_url }}
          resizeMethod="resize"
          style={{
            height: 300,
            width: 200,
          }}
        />
        <View style={styles.Card.footer}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'transperant',
            }}
          >
            {title && <Text>{title}</Text>}
            <Text>{this.trimUrl(title_link || og_scrape_url)}</Text>
          </View>
          {type === 'giphy' && <Image source={giphyLogo} />}
        </View>
      </TouchableOpacity>
    );
  }
}
