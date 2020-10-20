import React from 'react';
import {
  Image,
  ImageRequireSource,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { Attachment } from 'stream-chat';

import type { Alignment } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const giphyLogo: ImageRequireSource = require('../../../assets/Poweredby_100px-White_VertText.png');

const styles = StyleSheet.create({
  cardCover: {
    height: 150,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    width: 250,
  },
});

const trimUrl = (url?: string) =>
  url && url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];

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
  alignment: Alignment;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  Cover?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  Footer?: React.ComponentType<CardProps<At>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  Header?: React.ComponentType<CardProps<At>>;
};

/**
 * UI component for card in attachments.
 *
 * @example ./Card.md
 */
export const Card = <At extends UnknownType = DefaultAttachmentType>(
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

  const {
    theme: {
      colors: { light },
      message: {
        card: {
          container,
          cover,
          footer: {
            description,
            link,
            logo,
            title: titleStyle,
            ...footerStyle
          },
        },
      },
    },
  } = useTheme();

  const { additionalTouchableProps, onLongPress } = useMessageContentContext();

  const uri = image_url || thumb_url;

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={() => goToURL(og_scrape_url || image_url || thumb_url)}
      style={[
        styles.container,
        {
          backgroundColor: light,
          borderBottomLeftRadius: alignment === 'right' ? 16 : 2,
          borderBottomRightRadius: alignment === 'left' ? 16 : 2,
        },
        container,
      ]}
      testID='card-attachment'
      {...additionalTouchableProps}
    >
      {Header && <Header {...props} />}
      {Cover && <Cover {...props} />}
      {uri && !Cover && (
        <Image
          resizeMode='cover'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.cardCover, cover]}
        />
      )}
      {Footer ? (
        <Footer {...props} />
      ) : (
        <View style={[styles.cardFooter, footerStyle]}>
          <View style={{ backgroundColor: 'transparent' }}>
            {title && <Text style={titleStyle}>{title}</Text>}
            {text && <Text style={description}>{text}</Text>}
            <Text style={link}>{trimUrl(title_link || og_scrape_url)}</Text>
          </View>
          {type === 'giphy' && <Image source={giphyLogo} style={logo} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

Card.displayName = 'Card{message{card}}';
