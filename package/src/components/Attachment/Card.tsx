import React, { useMemo } from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
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
import { NewLink } from '../../icons/NewLink';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';
import { makeImageCompatibleUrl } from '../../utils/utils';
import { VideoPlayIndicator } from '../ui';
import { ImageBackground } from '../UIComponents/ImageBackground';

export type CardPropsWithContext = Pick<ChatContextValue, 'ImageComponent'> &
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'> &
  Pick<
    MessagesContextValue,
    | 'additionalPressableProps'
    | 'CardCover'
    | 'CardFooter'
    | 'CardHeader'
    | 'myMessageTheme'
    | 'isAttachmentEqual'
  > & {
    attachment: Attachment;
    channelId: string | undefined;
    messageId: string | undefined;
    styles?: Partial<{
      cardCover: StyleProp<ImageStyle>;
      cardFooter: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
      description: StyleProp<TextStyle>;
      linkPreview: StyleProp<ViewStyle>;
      linkPreviewText: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
  };

const CardWithContext = (props: CardPropsWithContext) => {
  const {
    attachment,
    additionalPressableProps,
    CardCover,
    CardFooter,
    CardHeader,
    ImageComponent = Image,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    styles: stylesProp = {},
  } = props;

  const {
    theme: { semantics },
  } = useTheme();

  const { image_url, og_scrape_url, text, thumb_url, title, type } = attachment;

  const {
    theme: {
      messageSimple: {
        card: {
          container,
          cover,
          footer: { description, title: titleStyle, ...footerStyle },
        },
      },
    },
  } = useTheme();

  const styles = useStyles();

  const uri = image_url || thumb_url;

  const defaultOnPress = () => openUrlSafely(og_scrape_url || uri);

  const isVideoCard = type === FileTypes.Video && og_scrape_url;

  return (
    <View style={styles.wrapper}>
      <Pressable
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
        {...additionalPressableProps}
      >
        {CardHeader && <CardHeader {...props} />}
        {CardCover && <CardCover {...props} />}
        {uri && !CardCover && (
          <ImageBackground
            ImageComponent={ImageComponent}
            imageStyle={styles.cardCover}
            resizeMode='cover'
            source={{ uri: makeImageCompatibleUrl(uri) }}
            style={[styles.cardCover, stylesProp.cardCover, cover]}
          >
            {isVideoCard ? <VideoPlayIndicator size='lg' /> : null}
          </ImageBackground>
        )}
        {CardFooter ? (
          <CardFooter {...props} />
        ) : (
          <View style={[styles.cardFooter, footerStyle, stylesProp.cardFooter]}>
            {title ? (
              <Text numberOfLines={1} style={[styles.title, titleStyle, stylesProp.title]}>
                {title}
              </Text>
            ) : null}
            {text ? (
              <Text
                numberOfLines={2}
                style={[styles.description, description, stylesProp.description]}
              >
                {text}
              </Text>
            ) : null}
            <View style={[styles.linkPreview, stylesProp.linkPreview]}>
              <NewLink height={12} width={12} stroke={semantics.chatTextIncoming} />
              <Text numberOfLines={1} style={[styles.linkPreviewText, stylesProp.linkPreviewText]}>
                {og_scrape_url}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const areEqual = (prevProps: CardPropsWithContext, nextProps: CardPropsWithContext) => {
  const {
    attachment: prevAttachment,
    myMessageTheme: prevMyMessageTheme,
    isAttachmentEqual,
  } = prevProps;
  const { attachment: nextAttachment, myMessageTheme: nextMyMessageTheme } = nextProps;
  const attachmentEqual =
    prevAttachment.image_url === nextAttachment.image_url &&
    prevAttachment.thumb_url === nextAttachment.thumb_url &&
    prevAttachment.type === nextAttachment.type &&
    prevAttachment.og_scrape_url === nextAttachment.og_scrape_url &&
    prevAttachment.text === nextAttachment.text &&
    prevAttachment.title === nextAttachment.title;
  if (!attachmentEqual) {
    return false;
  }

  if (isAttachmentEqual) {
    return isAttachmentEqual(prevAttachment, nextAttachment);
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedCard = React.memo(CardWithContext, areEqual) as typeof CardWithContext;

export type CardProps = Partial<
  Pick<ChatContextValue, 'ImageComponent'> &
    Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'myMessageTheme'> &
    Pick<
      MessagesContextValue,
      'additionalPressableProps' | 'CardCover' | 'CardFooter' | 'CardHeader'
    >
> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const Card = (props: CardProps) => {
  const { ImageComponent } = useChatContext();
  const { message, onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const {
    additionalPressableProps,
    CardCover,
    CardFooter,
    CardHeader,
    isAttachmentEqual,
    myMessageTheme,
  } = useMessagesContext();

  return (
    <MemoizedCard
      key={`${message?.id}${message?.updated_at}`} // press listeners must change on message update, updating key ensures this
      {...{
        additionalPressableProps,
        CardCover,
        CardFooter,
        CardHeader,
        channelId: message.cid,
        ImageComponent,
        isAttachmentEqual,
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage } = useMessageContext();

  return useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          paddingHorizontal: primitives.spacingXs,
          paddingTop: primitives.spacingXs,
        },
        container: {
          maxWidth: 256, // TODO: Fix this
          borderRadius: primitives.radiusLg,
          backgroundColor: isMyMessage
            ? semantics.chatBgAttachmentOutgoing
            : semantics.chatBgAttachmentIncoming,
          overflow: 'hidden',
        },
        cardCover: {
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: 16 / 9,
          alignSelf: 'stretch',
        },
        cardFooter: {
          justifyContent: 'space-between',
          gap: primitives.spacingXxs,
          padding: primitives.spacingSm,
        },
        title: {
          color: semantics.chatTextIncoming,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightTight,
        },
        description: {
          color: semantics.chatTextIncoming,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightTight,
        },
        linkPreview: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingXxs,
        },
        linkPreviewText: {
          color: semantics.chatTextIncoming,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightTight,
          flexShrink: 1,
        },
      }),
    [isMyMessage, semantics],
  );
};

Card.displayName = 'Card{messageSimple{card}}';
