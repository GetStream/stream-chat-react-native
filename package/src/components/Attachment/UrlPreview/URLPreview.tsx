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

export type URLPreviewPropsWithContext = Pick<ChatContextValue, 'ImageComponent'> &
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'> &
  Pick<
    MessagesContextValue,
    'additionalPressableProps' | 'myMessageTheme' | 'isAttachmentEqual'
  > & {
    attachment: Attachment;
    channelId: string | undefined;
    messageId: string | undefined;
    // TODO: Think of a better way to handle styles
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

const URLPreviewWithContext = (props: URLPreviewPropsWithContext) => {
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

  const { image_url, og_scrape_url, text, thumb_url, title, type } = attachment;

  const {
    theme: {
      messageSimple: {
        card: {
          container,
          cover,
          footer: { description, title: titleStyle, ...footerStyle },
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
          style={[styles.cardCover, stylesProp.cardCover, cover]}
        >
          {isVideoCard ? <VideoPlayIndicator size='lg' /> : null}
        </ImageBackground>
      )}

      <View style={[styles.cardFooter, footerStyle, stylesProp.cardFooter]}>
        {title ? (
          <Text numberOfLines={1} style={[styles.title, titleStyle, stylesProp.title]}>
            {title}
          </Text>
        ) : null}
        {text ? (
          <Text numberOfLines={2} style={[styles.description, description, stylesProp.description]}>
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
  );
};

const areEqual = (prevProps: URLPreviewPropsWithContext, nextProps: URLPreviewPropsWithContext) => {
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

const MemoizedURLPreview = React.memo(
  URLPreviewWithContext,
  areEqual,
) as typeof URLPreviewWithContext;

export type URLPreviewProps = Partial<URLPreviewPropsWithContext> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const URLPreview = (props: URLPreviewProps) => {
  const { ImageComponent } = useChatContext();
  const { message, onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const { additionalPressableProps, isAttachmentEqual, myMessageTheme } = useMessagesContext();

  return (
    <MemoizedURLPreview
      key={`${message?.id}${message?.updated_at}`} // press listeners must change on message update, updating key ensures this
      {...{
        additionalPressableProps,
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
        container: {
          maxWidth: 256, // TODO: Fix this
          borderRadius: primitives.radiusLg,
          backgroundColor: isMyMessage
            ? semantics.chatBgAttachmentOutgoing
            : semantics.chatBgAttachmentIncoming,
          overflow: 'hidden',
        },
        cardCover: {
          minWidth: 256,
          minHeight: 144,
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
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

URLPreview.displayName = 'URLPreview{messageSimple{card}}';
