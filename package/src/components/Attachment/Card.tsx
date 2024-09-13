import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import type { Attachment } from 'stream-chat';

import { openUrlSafely } from './utils/openUrlSafely';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Play } from '../../icons/Play';
import { DefaultStreamChatGenerics, FileTypes } from '../../types/types';
import { makeImageCompatibleUrl } from '../../utils/utils';
import { ImageBackground } from '../ImageBackground';

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
    left: 2,
    position: 'absolute',
  },
  cardCover: {
    alignItems: 'center',
    borderRadius: 8,
    height: 140,
    justifyContent: 'center',
    marginHorizontal: 2,
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
    marginHorizontal: 8,
  },
  playButtonStyle: {
    alignItems: 'center',
    borderRadius: 50,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    fontSize: 12,
    marginHorizontal: 8,
  },
});

export type CardPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Attachment<StreamChatGenerics> &
  Pick<ChatContextValue, 'ImageComponent'> &
  Pick<
    MessageContextValue<StreamChatGenerics>,
    'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
  > &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    'additionalTouchableProps' | 'CardCover' | 'CardFooter' | 'CardHeader' | 'myMessageTheme'
  > & {
    channelId: string | undefined;
    messageId: string | undefined;
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CardPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTouchableProps,
    author_name,
    CardCover,
    CardFooter,
    CardHeader,
    image_url,
    ImageComponent = Image,
    og_scrape_url,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    styles: stylesProp = {},
    text,
    thumb_url,
    title,
    type,
  } = props;

  const {
    theme: {
      colors: { accent_blue, black, blue_alice, static_black, static_white, transparent },
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
          playButtonStyle: { roundedView },
          playIcon: { height, width },
        },
      },
    },
  } = useTheme();

  const uri = image_url || thumb_url;

  const defaultOnPress = () => openUrlSafely(og_scrape_url || uri);

  const isVideoCard = type === FileTypes.Video && og_scrape_url;

  return (
    <TouchableOpacity
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            additionalInfo: { url: og_scrape_url },
            emitter: 'card',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            additionalInfo: { url: og_scrape_url },
            defaultHandler: defaultOnPress,
            emitter: 'card',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            additionalInfo: { url: og_scrape_url },
            defaultHandler: defaultOnPress,
            emitter: 'card',
            event,
          });
        }
      }}
      style={[styles.container, container, stylesProp.container]}
      testID='card-attachment'
      {...additionalTouchableProps}
    >
      {CardHeader && <CardHeader {...props} />}
      {CardCover && <CardCover {...props} />}
      {uri && !CardCover && (
        <View>
          <ImageBackground
            ImageComponent={ImageComponent}
            imageStyle={styles.cardCover}
            resizeMode='cover'
            source={{ uri: makeImageCompatibleUrl(uri) }}
            style={[styles.cardCover, stylesProp.cardCover, cover]}
          >
            {isVideoCard ? (
              <View
                style={[styles.playButtonStyle, roundedView, { backgroundColor: static_white }]}
              >
                <Play height={height} pathFill={static_black} width={width} />
              </View>
            ) : null}
          </ImageBackground>
          {author_name && (
            <View style={[styles.authorNameMask, authorNameMask, stylesProp.authorNameMask]}>
              <View
                style={[
                  styles.authorNameContainer,
                  { backgroundColor: blue_alice },
                  authorNameContainer,
                  stylesProp.authorNameContainer,
                ]}
              >
                <Text
                  style={[
                    styles.authorName,
                    { color: accent_blue },
                    authorName,
                    stylesProp.authorName,
                  ]}
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
              { backgroundColor: transparent },
              !uri ? { borderLeftColor: accent_blue, ...noURI } : {},
              authorNameFooterContainer,
              stylesProp.authorNameFooterContainer,
            ]}
          >
            {!uri && author_name && (
              <Text
                style={[
                  styles.authorNameFooter,
                  { color: accent_blue },
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
                style={[styles.title, { color: black }, titleStyle, stylesProp.title]}
              >
                {title}
              </Text>
            )}
            {text && (
              <Text
                numberOfLines={3}
                style={[styles.description, { color: black }, description, stylesProp.description]}
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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: CardPropsWithContext<StreamChatGenerics>,
  nextProps: CardPropsWithContext<StreamChatGenerics>,
) => {
  const { myMessageTheme: prevMyMessageTheme } = prevProps;
  const { myMessageTheme: nextMyMessageTheme } = nextProps;

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) return false;

  return true;
};

const MemoizedCard = React.memo(CardWithContext, areEqual) as typeof CardWithContext;

export type CardProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Attachment<StreamChatGenerics> &
  Partial<
    Pick<ChatContextValue<StreamChatGenerics>, 'ImageComponent'> &
      Pick<
        MessageContextValue<StreamChatGenerics>,
        'onLongPress' | 'onPress' | 'onPressIn' | 'myMessageTheme'
      > &
      Pick<
        MessagesContextValue<StreamChatGenerics>,
        'additionalTouchableProps' | 'CardCover' | 'CardFooter' | 'CardHeader'
      >
  >;

/**
 * UI component for card in attachments.
 */
export const Card = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CardProps<StreamChatGenerics>,
) => {
  const { ImageComponent } = useChatContext<StreamChatGenerics>();
  const { message, onLongPress, onPress, onPressIn, preventPress } =
    useMessageContext<StreamChatGenerics>();
  const { additionalTouchableProps, CardCover, CardFooter, CardHeader, myMessageTheme } =
    useMessagesContext<StreamChatGenerics>();

  return (
    <MemoizedCard
      key={`${message?.id}${message?.updated_at}`} // press listeners must change on message update, updating key ensures this
      {...{
        additionalTouchableProps,
        CardCover,
        CardFooter,
        CardHeader,
        channelId: message.cid,
        ImageComponent,
        messageId: message.id,
        myMessageTheme,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
      }}
      {...props}
    />
  );
};

Card.displayName = 'Card{messageSimple{card}}';
