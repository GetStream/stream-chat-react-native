import React, { useContext } from 'react';
import { Linking, View } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import giphyLogo from '../../assets/Poweredby_100px-White_VertText.png';
import { MessageContentContext } from '../../context';
import { themed } from '../../styles/theme';
import { makeImageCompatibleUrl } from '../../utils/utils';

const Container = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.light};
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2};
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  width: 250px;
  ${({ theme }) => theme.message.card.container.css}
`;

const CardCover = styled.Image`
  height: 150px;
  ${({ theme }) => theme.message.card.cover.css}
`;

const CardFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 10px;
  ${({ theme }) => theme.message.card.footer.css}
`;

const FooterDescription = styled.Text`
  ${({ theme }) => theme.message.card.footer.description.css}
`;

const FooterLink = styled.Text`
  ${({ theme }) => theme.message.card.footer.link.css}
`;

const FooterLogo = styled.Image`
  ${({ theme }) => theme.message.card.footer.logo.css}
`;

const FooterTitle = styled.Text`
  ${({ theme }) => theme.message.card.footer.title.css}
`;

const trimUrl = (url) => {
  let trimmedUrl;
  if (url !== undefined && url !== null) {
    trimmedUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  }
  return trimmedUrl;
};

const goToURL = (url) => {
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log(`Don't know how to open URI: ${url}`);
    }
  });
};

/**
 * UI component for card in attachments.
 *
 * @example ../docs/Card.md
 */
const Card = (props) => {
  const {
    alignment,
    Cover,
    Footer,
    Header,
    image_url,
    og_scrape_url,
    text,
    thumb_url,
    title,
    title_link,
    type,
  } = props;

  const { additionalTouchableProps, onLongPress } = useContext(
    MessageContentContext,
  );

  const uri = makeImageCompatibleUrl(image_url || thumb_url);

  return (
    <Container
      alignment={alignment}
      onLongPress={onLongPress}
      onPress={() => {
        goToURL(og_scrape_url || image_url || thumb_url);
      }}
      testID='card-attachment'
      {...additionalTouchableProps}
    >
      {Header && <Header {...props} />}
      {Cover && <Cover {...props} />}
      {uri && !Cover && <CardCover resizeMode='cover' source={{ uri }} />}
      {Footer ? (
        <Footer {...props} />
      ) : (
        <CardFooter>
          <View style={{ backgroundColor: 'transparent' }}>
            {title && <FooterTitle>{title}</FooterTitle>}
            {text && <FooterDescription>{text}</FooterDescription>}
            <FooterLink>{trimUrl(title_link || og_scrape_url)}</FooterLink>
          </View>
          {type === 'giphy' && <FooterLogo source={giphyLogo} />}
        </CardFooter>
      )}
    </Container>
  );
};

Card.propTypes = {
  /**
   * Provide any additional props for child `TouchableOpacity`.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   */
  additionalTouchableProps: PropTypes.object,
  alignment: PropTypes.string,
  Cover: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  Footer: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  Header: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** The url of the full sized image */
  image_url: PropTypes.string,
  /** The scraped url, used as a fallback if the OG-data doesn't include a link */
  og_scrape_url: PropTypes.string,
  onLongPress: PropTypes.func,
  /** Description returned by the OG scraper */
  text: PropTypes.string,
  /** The url for thumbnail sized image*/
  thumb_url: PropTypes.string,
  /** Title returned by the OG scraper */
  title: PropTypes.string,
  /** Link returned by the OG scraper */
  title_link: PropTypes.string,
  type: PropTypes.string,
};

Card.themePath = 'card';

export default themed(Card);
