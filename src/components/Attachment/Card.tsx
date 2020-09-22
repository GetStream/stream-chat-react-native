import React from 'react';
import { ImageRequireSource, Linking, View } from 'react-native';
import type { Attachment, UnknownType } from 'stream-chat';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { DefaultAttachmentType } from '../../types/types';

const giphyLogo: ImageRequireSource = require('../../assets/Poweredby_100px-White_VertText.png');

const Container = styled.TouchableOpacity<{ alignment: 'right' | 'left' }>`
  background-color: ${({ theme }) => theme.colors.light};
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
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

const trimUrl = (url?: string) => {
  let trimmedUrl;
  if (url !== undefined && url !== null) {
    trimmedUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  }
  return trimmedUrl;
};

const goToURL = (url?: string) => {
  if (!url) return;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log(`Don't know how to open URI: ${url}`);
    }
  });
};

export type CardProps<
  At extends UnknownType = DefaultAttachmentType
> = Attachment<At> & {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: 'right' | 'left';
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  Cover?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  Footer?: React.ComponentType<Partial<CardProps<At>>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  Header?: React.ComponentType<Partial<CardProps<At>>>;
};

/**
 * UI component for card in attachments.
 *
 * @example ../docs/Card.md
 */
const Card = <At extends UnknownType = DefaultAttachmentType>(
  props: CardProps<At>,
) => {
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

  const { additionalTouchableProps, onLongPress } = useMessageContentContext();

  const uri = image_url || thumb_url;
  if (uri) {
    makeImageCompatibleUrl(uri);
  }

  return (
    <Container
      alignment={alignment}
      onLongPress={onLongPress}
      onPress={() => goToURL(og_scrape_url || image_url || thumb_url)}
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

Card.themePath = 'card';

export default themed(Card) as typeof Card;
