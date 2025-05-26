import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import {
  ImageGalleryContextValue,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useLoadingImage } from '../../hooks/useLoadingImage';
import { GiphyIcon, GiphyLightning } from '../../icons';

import { makeImageCompatibleUrl } from '../../utils/utils';

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
  },
  buttonContainer: {
    alignItems: 'center',
    borderTopWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  cancel: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  centerChild: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 270,
  },
  giphy: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 170,
    maxWidth: 270,
    width: 270,
  },
  giphyContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  giphyHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  giphyHeaderTitle: {
    fontSize: 14,
  },
  giphyMask: {
    bottom: 8,
    left: 8,
    position: 'absolute',
  },
  giphyMaskText: {
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
  },
  imageErrorIndicatorStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageLoadingIndicatorStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
  },
  selectionContainer: {
    borderBottomRightRadius: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: 272,
  },
  selectionImageContainer: {
    alignSelf: 'center',
    margin: 1,
  },
  send: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  shuffle: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  shuffleButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});

export type GiphyPropsWithContext = Pick<
  ImageGalleryContextValue,
  'setSelectedMessage' | 'setMessages'
> &
  Pick<
    MessageContextValue,
    | 'handleAction'
    | 'isMyMessage'
    | 'message'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
  > &
  Pick<ChatContextValue, 'ImageComponent'> &
  Pick<
    MessagesContextValue,
    | 'giphyVersion'
    | 'additionalPressableProps'
    | 'ImageLoadingIndicator'
    | 'ImageLoadingFailedIndicator'
  > & {
    attachment: Attachment;
  } & Pick<OverlayContextValue, 'setOverlay'>;

const GiphyWithContext = (props: GiphyPropsWithContext) => {
  const {
    additionalPressableProps,
    attachment,
    giphyVersion,
    handleAction,
    ImageComponent = Image,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    isMyMessage,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setMessages,
    setOverlay,
    setSelectedMessage,
  } = props;

  const { actions, giphy: giphyData, image_url, thumb_url, title, type } = attachment;

  const { isLoadingImage, isLoadingImageError, setLoadingImage, setLoadingImageError } =
    useLoadingImage();

  const {
    theme: {
      colors: { accent_blue, black, grey, grey_dark, grey_gainsboro, label_bg_transparent, white },
      messageSimple: {
        giphy: {
          buttonContainer,
          cancel,
          container,
          giphy,
          giphyContainer,
          giphyHeaderText,
          giphyHeaderTitle,
          giphyMask,
          giphyMaskText,
          header,
          selectionContainer,
          send,
          shuffle,
        },
      },
    },
  } = useTheme();

  let uri = image_url || thumb_url;
  const giphyDimensions: { height?: number; width?: number } = {};

  const defaultOnPress = () => {
    setMessages([message]);
    setSelectedMessage({ messageId: message.id, url: uri });
    setOverlay('gallery');
  };

  if (type === 'giphy' && giphyData) {
    const giphyVersionInfo = giphyData[giphyVersion];
    uri = giphyVersionInfo.url;
    giphyDimensions.height = parseFloat(giphyVersionInfo.height);
    giphyDimensions.width = parseFloat(giphyVersionInfo.width);
  }

  if (!uri) {
    return null;
  }

  return actions ? (
    <View
      style={[
        styles.selectionContainer,
        { backgroundColor: white, borderColor: `${black}0D` },
        selectionContainer,
      ]}
      testID='giphy-action-attachment'
    >
      <View style={[styles.header, header]}>
        <GiphyIcon />
        <Text style={[styles.giphyHeaderText, giphyHeaderText]}>Giphy</Text>
        <Text
          style={[styles.giphyHeaderTitle, giphyHeaderTitle, { color: grey_dark }]}
        >{`/giphy ${title}`}</Text>
      </View>
      <View style={styles.selectionImageContainer}>
        <ImageComponent
          onError={(error) => {
            console.warn(error);
            setLoadingImage(false);
            setLoadingImageError(true);
          }}
          onLoadEnd={() => setLoadingImage(false)}
          onLoadStart={() => setLoadingImage(true)}
          resizeMode='contain'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphyDimensions, giphy]}
        />
      </View>
      <View>
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              if (actions?.[2].name && actions?.[2].value && handleAction) {
                handleAction(actions[2].name, actions[2].value);
              }
            }}
            style={[
              styles.buttonContainer,
              { borderColor: grey_gainsboro, borderRightWidth: 1 },
              buttonContainer,
            ]}
            testID={`${actions?.[2].value}-action-button`}
          >
            <Text style={[styles.cancel, { color: grey }, cancel]}>{actions?.[2].text}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (actions?.[1].name && actions?.[1].value && handleAction) {
                handleAction(actions[1].name, actions[1].value);
              }
            }}
            style={[
              styles.buttonContainer,
              { borderColor: grey_gainsboro, borderRightWidth: 1 },
              buttonContainer,
            ]}
            testID={`${actions?.[1].value}-action-button`}
          >
            <Text style={[styles.shuffle, { color: grey }, shuffle]}>{actions?.[1].text}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (actions?.[0].name && actions?.[0].value && handleAction) {
                handleAction(actions[0].name, actions[0].value);
              }
            }}
            style={[styles.buttonContainer, { borderColor: grey_gainsboro }, buttonContainer]}
            testID={`${actions?.[0].value}-action-button`}
          >
            <Text style={[styles.send, { color: accent_blue }, send]}>{actions?.[0].text}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  ) : (
    <Pressable
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            emitter: 'giphy',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: defaultOnPress,
            emitter: 'giphy',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            emitter: 'giphy',
            event,
          });
        }
      }}
      testID='giphy-attachment'
      {...additionalPressableProps}
    >
      <View
        style={[
          styles.container,
          styles.centerChild,
          { backgroundColor: isMyMessage ? grey_gainsboro : white },
          container,
        ]}
      >
        <ImageComponent
          accessibilityLabel='Giphy Attachment Image'
          onError={(error) => {
            console.warn(error);
            setLoadingImage(false);
            setLoadingImageError(true);
          }}
          onLoadEnd={() => setLoadingImage(false)}
          onLoadStart={() => setLoadingImage(true)}
          resizeMode='contain'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphyDimensions, giphy]}
          testID='giphy-attachment-image'
        />

        {isLoadingImageError && (
          <View style={{ position: 'absolute' }}>
            <ImageLoadingFailedIndicator style={styles.imageErrorIndicatorStyle} />
          </View>
        )}
        {isLoadingImage && (
          <View style={{ position: 'absolute' }}>
            <ImageLoadingIndicator style={styles.imageLoadingIndicatorStyle} />
          </View>
        )}
        <View style={[styles.giphyMask, giphyMask]}>
          <View
            style={[
              styles.giphyContainer,
              { backgroundColor: label_bg_transparent },
              giphyContainer,
            ]}
          >
            <GiphyLightning fill={white} size={16} />
            <Text style={[styles.giphyMaskText, { color: white }, giphyMaskText]}>
              {type?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const areEqual = (prevProps: GiphyPropsWithContext, nextProps: GiphyPropsWithContext) => {
  const {
    attachment: { actions: prevActions, image_url: prevImageUrl, thumb_url: prevThumbUrl },
    giphyVersion: prevGiphyVersion,
    isMyMessage: prevIsMyMessage,
    message: prevMessage,
  } = prevProps;
  const {
    attachment: { actions: nextActions, image_url: nextImageUrl, thumb_url: nextThumbUrl },
    giphyVersion: nextGiphyVersion,
    isMyMessage: nextIsMyMessage,
    message: nextMessage,
  } = nextProps;

  const imageUrlEqual = prevImageUrl === nextImageUrl;
  if (!imageUrlEqual) {
    return false;
  }

  const thumbUrlEqual = prevThumbUrl === nextThumbUrl;
  if (!thumbUrlEqual) {
    return false;
  }

  const actionsEqual =
    Array.isArray(prevActions) === Array.isArray(nextActions) &&
    ((Array.isArray(prevActions) &&
      Array.isArray(nextActions) &&
      prevActions.length === nextActions.length) ||
      prevActions === nextActions);
  if (!actionsEqual) {
    return false;
  }

  const giphyVersionEqual = prevGiphyVersion === nextGiphyVersion;
  if (!giphyVersionEqual) {
    return false;
  }

  const isMyMessageEqual = prevIsMyMessage === nextIsMyMessage;
  if (!isMyMessageEqual) {
    return false;
  }

  const messageEqual =
    prevMessage?.id === nextMessage?.id &&
    `${prevMessage?.updated_at}` === `${nextMessage?.updated_at}`;

  if (!messageEqual) {
    return false;
  }
  return true;
};

const MemoizedGiphy = React.memo(GiphyWithContext, areEqual) as typeof GiphyWithContext;

export type GiphyProps = Partial<GiphyPropsWithContext> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const Giphy = (props: GiphyProps) => {
  const { handleAction, isMyMessage, message, onLongPress, onPress, onPressIn, preventPress } =
    useMessageContext();
  const { ImageComponent } = useChatContext();
  const { additionalPressableProps, giphyVersion } = useMessagesContext();
  const { setMessages, setSelectedMessage } = useImageGalleryContext();
  const { setOverlay } = useOverlayContext();

  const {
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
  } = useMessagesContext();
  const ImageLoadingFailedIndicator =
    ContextImageLoadingFailedIndicator || props.ImageLoadingFailedIndicator;
  const ImageLoadingIndicator = ContextImageLoadingIndicator || props.ImageLoadingIndicator;

  return (
    <MemoizedGiphy
      {...{
        additionalPressableProps,
        giphyVersion,
        handleAction,
        ImageComponent,
        ImageLoadingFailedIndicator,
        ImageLoadingIndicator,
        isMyMessage,
        message,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setMessages,
        setOverlay,
        setSelectedMessage,
      }}
      {...props}
    />
  );
};

Giphy.displayName = 'Giphy{messageSimple{giphy}}';
