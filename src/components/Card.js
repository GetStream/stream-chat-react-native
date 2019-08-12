import React from 'react';
import { Image, Text, View, Linking } from 'react-native';
import PropTypes from 'prop-types';
import giphyLogo from '../assets/Poweredby_100px-White_VertText.png';
import { themed } from '../styles/theme';
import { withMessageContentContext } from '../context';

import styled from '@stream-io/styled-components';
import { makeImageCompatibleUrl } from '../utils';

const Container = styled.TouchableOpacity`
  border-top-left-radius: 16;
  border-top-right-radius: 16;
  overflow: hidden;
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2};
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2};
  background-color: ${({ theme }) => theme.colors.light};
  width: 250;
  ${({ theme }) => theme.message.card.container.css}
`;

const Footer = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px;
  ${({ theme }) => theme.message.card.footer.css}
`;

const Cover = styled.Image`
  display: flex;
  height: 150;
  ${({ theme }) => theme.message.card.cover.css}
`;

/**
 * UI component for card in attachments.
 *
 * @example ./docs/Card.md
 * @extends PureComponent
 */
export const Card = withMessageContentContext(
  themed(
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
        type: PropTypes.string,
        alignment: PropTypes.string,
        onLongPress: PropTypes.func,
      };

      constructor(props) {
        super(props);
      }

      trimUrl = (url) => {
        let trimmedUrl;
        if (url !== undefined && url !== null) {
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
          text,
          title_link,
          og_scrape_url,
          type,
          alignment,
          onLongPress,
        } = this.props;
        return (
          <Container
            onPress={() => {
              this._goToURL(og_scrape_url || image_url || thumb_url);
            }}
            onLongPress={onLongPress}
            alignment={alignment}
          >
            <Cover
              source={{ uri: makeImageCompatibleUrl(image_url || thumb_url) }}
              resizMode="cover"
            />
            <Footer>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'transperant',
                }}
              >
                {title && <Text>{title}</Text>}
                {text && <Text>{text}</Text>}
                <Text>{this.trimUrl(title_link || og_scrape_url)}</Text>
              </View>
              {type === 'giphy' && <Image source={giphyLogo} />}
            </Footer>
          </Container>
        );
      }
    },
  ),
);
