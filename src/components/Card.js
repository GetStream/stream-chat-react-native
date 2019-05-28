import React from 'react';
import { Image, Text, View, Linking } from 'react-native';
import PropTypes from 'prop-types';
import giphyLogo from '../assets/Poweredby_100px-White_VertText.png';
import { themed } from '../styles/theme';

import styled from '@stream-io/styled-components';

const Container = styled.TouchableOpacity`
  border-top-left-radius: ${({ theme }) =>
    theme.card.container.borderTopLeftRadius};
  border-top-right-radius: ${({ theme }) =>
    theme.card.container.borderTopRightRadius};
  overflow: ${({ theme }) => theme.card.container.overflow};
  border-bottom-left-radius: ${({ theme, alignment }) =>
    alignment === 'right' ? theme.card.container.borderBottomLeftRadius : 2};
  border-bottom-right-radius: ${({ theme, alignment }) =>
    alignment === 'left' ? theme.card.container.borderBottomRightRadius : 2};
  background-color: ${({ theme }) => theme.card.container.backgroundColor};
  width: ${({ theme }) => theme.card.container.width};
  ${({ theme }) => theme.card.container.extra}
`;

const Footer = styled.View`
  display: ${({ theme }) => theme.card.footer.display};
  flex-direction: ${({ theme }) => theme.card.footer.flexDirection};
  justify-content: ${({ theme }) => theme.card.footer.justifyContent};
  padding: ${({ theme }) => theme.card.footer.padding}px;
  ${({ theme }) => theme.card.footer.extra}
`;

const Cover = styled.Image`
  display: ${({ theme }) => theme.card.cover.display};
  height: ${({ theme }) => theme.card.cover.height};
  ${({ theme }) => theme.card.cover.extra}
`;

export const Card = themed(
  class Card extends React.Component {
    static themePath = 'card';
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
          <Footer>
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
  },
);
