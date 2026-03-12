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

import { ChatContextValue, useChatContext } from '../../../contexts/chatContext/ChatContext';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Link } from '../../../icons/Link';
import { primitives } from '../../../theme';
import { FileTypes } from '../../../types/types';
import { makeImageCompatibleUrl } from '../../../utils/utils';
import { VideoPlayIndicator } from '../../ui';
import { ImageBackground } from '../../UIComponents/ImageBackground';
import { openUrlSafely } from '../utils/openUrlSafely';

export type URLPreviewCompactPropsWithContext = Pick<ChatContextValue, 'ImageComponent'> &
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'> &
  Pick<MessagesContextValue, 'additionalPressableProps' | 'myMessageTheme'> & {
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

const URLPreviewCompactWithContext = (props: URLPreviewCompactPropsWithContext) => {
  const {
    attachment,
    additionalPressableProps,
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

  const { image_url, og_scrape_url, text, thumb_url, title: titleText, type } = attachment;

  const {
    theme: {
      messageSimple: {
        compactUrlPreview: {
          wrapper,
          container,
          cardCover,
          cardFooter,
          title,
          description,
          linkPreview,
          linkPreviewText,
        },
      },
    },
  } = useTheme();

  const styles = useStyles();

  const uri = image_url || thumb_url;

  const defaultOnPress = () => openUrlSafely(og_scrape_url || uri);

  const isVideoCard = type === FileTypes.Video && og_scrape_url;

  return (
    <View style={[styles.wrapper, wrapper]}>
      <Pressable
        disabled={preventPress}
        onLongPress={(event) => {
          if (onLongPress) {
            onLongPress({
              additionalInfo: { url: og_scrape_url },
              emitter: 'urlPreview',
              event,
            });
          }
        }}
        onPress={(event) => {
          if (onPress) {
            onPress({
              additionalInfo: { url: og_scrape_url },
              defaultHandler: defaultOnPress,
              emitter: 'urlPreview',
              event,
            });
          }
        }}
        onPressIn={(event) => {
          if (onPressIn) {
            onPressIn({
              additionalInfo: { url: og_scrape_url },
              defaultHandler: defaultOnPress,
              emitter: 'urlPreview',
              event,
            });
          }
        }}
        style={[styles.container, container, stylesProp.container]}
        testID='card-attachment'
        {...additionalPressableProps}
      >
        {uri && (
          <ImageBackground
            ImageComponent={ImageComponent}
            imageStyle={styles.cardCover}
            resizeMode='cover'
            source={{ uri: makeImageCompatibleUrl(uri) }}
            style={[styles.cardCover, stylesProp.cardCover, cardCover]}
          >
            {isVideoCard ? <VideoPlayIndicator size='lg' /> : null}
          </ImageBackground>
        )}
        <View style={[styles.cardFooter, cardFooter, stylesProp.cardFooter]}>
          {title ? (
            <Text numberOfLines={1} style={[styles.title, title, stylesProp.title]}>
              {titleText}
            </Text>
          ) : null}
          {text ? (
            <Text
              numberOfLines={1}
              style={[styles.description, description, stylesProp.description]}
            >
              {text}
            </Text>
          ) : null}
          <View style={[styles.linkPreview, linkPreview, stylesProp.linkPreview]}>
            <Link height={12} width={12} stroke={semantics.chatTextIncoming} />
            <Text
              numberOfLines={1}
              style={[styles.linkPreviewText, linkPreviewText, stylesProp.linkPreviewText]}
            >
              {og_scrape_url}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const areEqual = (
  prevProps: URLPreviewCompactPropsWithContext,
  nextProps: URLPreviewCompactPropsWithContext,
) => {
  const { attachment: prevAttachment, myMessageTheme: prevMyMessageTheme } = prevProps;
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

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedURLPreviewCompact = React.memo(
  URLPreviewCompactWithContext,
  areEqual,
) as typeof URLPreviewCompactWithContext;

export type URLPreviewCompactProps = Partial<URLPreviewCompactPropsWithContext> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const URLPreviewCompact = (props: URLPreviewCompactProps) => {
  const { ImageComponent } = useChatContext();
  const { message, onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const { additionalPressableProps, myMessageTheme } = useMessagesContext();

  return (
    <MemoizedURLPreviewCompact
      key={`${message?.id}${message?.updated_at}`} // press listeners must change on message update, updating key ensures this
      {...{
        additionalPressableProps,
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
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingXs,
          paddingLeft: primitives.spacingXs,
          paddingRight: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
        cardCover: {
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: 1 / 1,
          height: 40,
          width: 40,
          borderRadius: primitives.radiusMd,
        },
        cardFooter: {
          justifyContent: 'space-between',
          flexShrink: 1,
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

URLPreviewCompact.displayName = 'URLPreviewCompact{messageSimple{urlPreviewCompact}}';
