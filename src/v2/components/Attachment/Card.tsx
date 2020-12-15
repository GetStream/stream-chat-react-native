import React from 'react';
import {
  Image,
  ImageStyle,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
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
  authorName: { fontSize: 14.5, fontWeight: '600' },
  authorNameContainer: {
    borderTopRightRadius: 15,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  authorNameFooter: {
    fontSize: 14.5,
    fontWeight: '600',
    padding: 8,
  },
  authorNameMask: {
    bottom: 0,
    left: 8,
    position: 'absolute',
  },
  cardCover: {
    borderRadius: 8,
    height: 140,
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  container: {
    overflow: 'hidden',
    width: 256,
  },
  description: {
    fontSize: 12,
  },
  title: {
    fontSize: 12,
  },
});

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
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps' | 'CardCover' | 'CardFooter' | 'CardHeader'
  > & {
    styles?: Partial<{
      authorName: StyleProp<TextStyle>;
      authorNameContainer: StyleProp<ViewStyle>;
      authorNameFooter: StyleProp<TextStyle>;
      authorNameFooterContainer: StyleProp<ViewStyle>;
      authorNameMask: StyleProp<ViewStyle>;
      cardCover: StyleProp<ImageStyle>;
      cardFooter: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
      description: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

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
    author_name,
    CardCover,
    CardFooter,
    CardHeader,
    image_url,
    og_scrape_url,
    onLongPress,
    styles: stylesProp = {},
    text,
    thumb_url,
    title,
  } = props;

  const {
    theme: {
      messageSimple: {
        card: {
          authorName,
          authorNameContainer,
          authorNameFooter,
          authorNameFooterContainer,
          authorNameMask,
          container,
          cover,
          footer: { description, title: titleStyle, ...footerStyle },
          noURI,
        },
      },
    },
  } = useTheme();

  const uri = image_url || thumb_url;

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={() => goToURL(og_scrape_url || uri)}
      style={[styles.container, container, stylesProp.container]}
      testID='card-attachment'
      {...additionalTouchableProps}
    >
      {CardHeader && <CardHeader {...props} />}
      {CardCover && <CardCover {...props} />}
      {uri && !CardCover && (
        <View>
          <Image
            resizeMode='cover'
            source={{ uri: makeImageCompatibleUrl(uri) }}
            style={[styles.cardCover, cover, stylesProp.cardCover]}
          />
          {author_name && (
            <View
              style={[
                styles.authorNameMask,
                authorNameMask,
                stylesProp.authorNameMask,
              ]}
            >
              <View
                style={[
                  styles.authorNameContainer,
                  authorNameContainer,
                  stylesProp.authorNameContainer,
                ]}
              >
                <Text
                  style={[styles.authorName, authorName, stylesProp.authorName]}
                >
                  {author_name}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      {CardFooter ? (
        <CardFooter {...props} />
      ) : (
        <View style={[styles.cardFooter, footerStyle, stylesProp.cardFooter]}>
          <View
            style={[
              authorNameFooterContainer,
              !uri ? noURI : {},
              stylesProp.authorNameFooterContainer,
            ]}
          >
            {!uri && author_name && (
              <Text
                style={[
                  styles.authorNameFooter,
                  authorNameFooter,
                  stylesProp.authorNameFooter,
                ]}
              >
                {author_name}
              </Text>
            )}
            {title && (
              <Text
                numberOfLines={1}
                style={[styles.title, titleStyle, stylesProp.title]}
              >
                {title}
              </Text>
            )}
            {text && (
              <Text
                numberOfLines={3}
                style={[
                  styles.description,
                  description,
                  stylesProp.description,
                ]}
              >
                {text}
              </Text>
            )}
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
    Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress'> &
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
  const { onLongPress } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
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
