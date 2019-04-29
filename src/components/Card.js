import React from 'react';
import { Image, Text, View } from 'react-native';
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

  render() {
    const {
      image_url,
      thumb_url,
      title,
      text,
      title_link,
      og_scrape_url,
    } = this.props;
    return (
      <React.Fragment>
        <Image
          source={{ uri: image_url || thumb_url }}
          resizeMethod="resize"
          style={{
            height: 200,
            width: 200,
          }}
        />
        <View style={styles.footer}>
          <View styles={{ display: 'flex', flexDirection: 'column' }}>
            {title && <Text>{title}</Text>}
            {text && <Text>{text}</Text>}
            <Text>{this.trimUrl(title_link || og_scrape_url)}</Text>
          </View>
          <Image source={giphyLogo} />
        </View>
      </React.Fragment>
    );
  }
}
