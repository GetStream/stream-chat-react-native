import React from 'react';
import { Image, Text, View, Linking } from 'react-native';
import PropTypes from 'prop-types';
import giphyLogo from '../assets/Poweredby_100px-White_VertText.png';
import { styles } from '../styles/styles.js';
import { getTheme } from '../styles/theme';

import styled from 'styled-components';

const Container = styled.TouchableOpacity`
  border-top-left-radius: ${(props) =>
    getTheme(props).card.container.borderTopLeftRadius};
  border-top-right-radius: ${(props) =>
    getTheme(props).card.container.borderTopRightRadius};
  overflow: ${(props) => getTheme(props).card.container.overflow};
  border-bottom-left-radius: ${(props) =>
    props.alignment === 'right'
      ? getTheme(props).card.container.borderBottomLeftRadius
      : 2};
  border-bottom-right-radius: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).card.container.borderBottomRightRadius
      : 2};
  background-color: ${(props) =>
    getTheme(props).card.container.backgroundColor};
  width: ${(props) => getTheme(props).card.container.width};
`;

const Footer = styled.View`
  display: ${(props) => getTheme(props).card.footer.display};
  flex-direction: ${(props) => getTheme(props).card.footer.flexDirection};
  justify-content: ${(props) => getTheme(props).card.footer.justifyContent};
  padding: ${(props) => getTheme(props).card.footer.padding}px;
`;

const Cover = styled.Image`
  display: ${(props) => getTheme(props).card.cover.display};
  height: ${(props) => getTheme(props).card.cover.height};
`;

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
      alignment,
    } = this.props;
    return (
      <Container
        onPress={() => {
          this._goToURL(og_scrape_url || image_url || thumb_url);
        }}
        alignment={alignment}
      >
        <Cover source={{ uri: image_url || thumb_url }} resizMode="cover" />
        <Footer style={styles.Card.footer}>
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
        </Footer>
      </Container>
    );
  }
}
