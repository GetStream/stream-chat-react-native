import React from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { Attachment } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

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

export type CardPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Attachment<At> &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'alignment' | 'onLongPress'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps' | 'CardCover' | 'CardFooter' | 'CardHeader'
  >;

const CardWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: CardPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    alignment,
    CardCover,
    CardFooter,
    CardHeader,
    image_url,
    og_scrape_url,
    onLongPress,
    text,
    thumb_url,
    title,
    title_link,
  } = props;

  const {
    theme: {
      colors: { light },
      messageSimple: {
        card: {
          container,
          cover,
          footer: { description, link, title: titleStyle, ...footerStyle },
        },
      },
    },
  } = useTheme();

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
      {CardHeader && <CardHeader {...props} />}
      {CardCover && <CardCover {...props} />}
      {uri && !CardCover && (
        <Image
          resizeMode='cover'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.cardCover, cover]}
        />
      )}
      {CardFooter ? (
        <CardFooter {...props} />
      ) : (
        <View style={[styles.cardFooter, footerStyle]}>
          <View style={{ backgroundColor: 'transparent' }}>
            {title && <Text style={titleStyle}>{title}</Text>}
            {text && <Text style={description}>{text}</Text>}
            <Text style={link}>{trimUrl(title_link || og_scrape_url)}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MemoizedCard = React.memo(
  CardWithContext,
  () => true,
) as typeof CardWithContext;

export type CardProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Attachment<At> &
  Partial<
    Pick<
      MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'alignment' | 'onLongPress'
    > &
      Pick<
        MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
        'additionalTouchableProps' | 'CardCover' | 'CardFooter' | 'CardHeader'
      >
  >;

/**
 * UI component for card in attachments.
 *
 * @example ./Card.md
 */
export const Card = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: CardProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, onLongPress } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const {
    additionalTouchableProps,
    CardCover,
    CardFooter,
    CardHeader,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedCard
      {...{
        additionalTouchableProps,
        alignment,
        CardCover,
        CardFooter,
        CardHeader,
        onLongPress,
      }}
      {...props}
    />
  );
};

Card.displayName = 'Card{messageSimple{card}}';
