import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Attachment } from 'stream-chat';

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
import { GiphyIcon } from '../../icons';
import { Lightning } from '../../icons/Lightning';
import type { DefaultStreamChatGenerics } from '../../types/types';
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
  container: {
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
    height: 24,
    justifyContent: 'center',
    width: 68,
  },
  giphyHeaderText: {
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    padding: 8,
    width: '60%',
  },
  selectionContainer: {
    borderBottomLeftRadius: 8,
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

export type GiphyPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ImageGalleryContextValue<StreamChatGenerics>, 'setImage' | 'setImages'> &
  Pick<
    MessageContextValue<StreamChatGenerics>,
    | 'handleAction'
    | 'isMyMessage'
    | 'message'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
  > &
  Pick<MessagesContextValue<StreamChatGenerics>, 'giphyVersion' | 'additionalTouchableProps'> & {
    attachment: Attachment<StreamChatGenerics>;
  } & Pick<OverlayContextValue, 'setOverlay'>;

const GiphyWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GiphyPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTouchableProps,
    attachment,
    giphyVersion = 'fixed_width_downsampled',
    handleAction,
    isMyMessage,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setImage,
    setImages,
    setOverlay,
  } = props;

  const { actions, giphy: giphyData, image_url, thumb_url, title, type } = attachment;

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
    setImages([message]);
    setImage({ messageId: message.id, url: uri });
    setOverlay('gallery');
  };

  if (type === 'giphy' && giphyData) {
    const giphyVersionInfo = giphyData[giphyVersion];
    uri = giphyVersionInfo.url;
    giphyDimensions.height = parseFloat(giphyVersionInfo.height);
    giphyDimensions.width = parseFloat(giphyVersionInfo.width);
  }

  if (!uri) return null;

  return actions ? (
    <View
      style={[
        styles.selectionContainer,
        { backgroundColor: white, borderColor: `${black}0D` },
        selectionContainer,
      ]}
    >
      <View style={[styles.header, header]}>
        <GiphyIcon />
        <Text style={[styles.giphyHeaderText, giphyHeaderText]}>Giphy</Text>
        <Text
          style={[styles.giphyHeaderTitle, giphyHeaderTitle, { color: grey_dark }]}
        >{`/giphy ${title}`}</Text>
      </View>
      <View style={styles.selectionImageContainer}>
        <Image
          resizeMode='contain'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphyDimensions, giphy]}
        />
      </View>
      <View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
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
          >
            <Text style={[styles.cancel, { color: grey }, cancel]}>{actions?.[2].text}</Text>
          </TouchableOpacity>
          <TouchableOpacity
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
          >
            <Text style={[styles.shuffle, { color: grey }, shuffle]}>{actions?.[1].text}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[0].name && actions?.[0].value && handleAction) {
                handleAction(actions[0].name, actions[0].value);
              }
            }}
            style={[styles.buttonContainer, { borderColor: grey_gainsboro }, buttonContainer]}
          >
            <Text style={[styles.send, { color: accent_blue }, send]}>{actions?.[0].text}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : (
    <TouchableOpacity
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
      {...additionalTouchableProps}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: isMyMessage ? grey_gainsboro : white },
          container,
        ]}
      >
        <Image
          resizeMode='contain'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphyDimensions, giphy]}
          testID='giphy-attachment-image'
        />
        <View style={[styles.giphyMask, giphyMask]}>
          <View
            style={[
              styles.giphyContainer,
              { backgroundColor: label_bg_transparent },
              giphyContainer,
            ]}
          >
            <Lightning height={16} pathFill={white} width={16} />
            <Text style={[styles.giphyMaskText, { color: white }, giphyMaskText]}>
              {type?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: GiphyPropsWithContext<StreamChatGenerics>,
  nextProps: GiphyPropsWithContext<StreamChatGenerics>,
) => {
  const {
    attachment: { actions: prevActions, image_url: prevImageUrl, thumb_url: prevThumbUrl },
    giphyVersion: prevGiphyVersion,
    isMyMessage: prevIsMyMessage,
  } = prevProps;
  const {
    attachment: { actions: nextActions, image_url: nextImageUrl, thumb_url: nextThumbUrl },
    giphyVersion: nextGiphyVersion,
    isMyMessage: nextIsMyMessage,
  } = nextProps;

  const imageUrlEqual = prevImageUrl === nextImageUrl;
  if (!imageUrlEqual) return false;

  const thumbUrlEqual = prevThumbUrl === nextThumbUrl;
  if (!thumbUrlEqual) return false;

  const actionsEqual =
    Array.isArray(prevActions) === Array.isArray(nextActions) &&
    ((Array.isArray(prevActions) &&
      Array.isArray(nextActions) &&
      prevActions.length === nextActions.length) ||
      prevActions === nextActions);
  if (!actionsEqual) return false;

  const giphyVersionEqual = prevGiphyVersion === nextGiphyVersion;
  if (!giphyVersionEqual) return false;

  const isMyMessageEqual = prevIsMyMessage === nextIsMyMessage;
  if (!isMyMessageEqual) return false;

  return true;
};

const MemoizedGiphy = React.memo(GiphyWithContext, areEqual) as typeof GiphyWithContext;

export type GiphyProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<GiphyPropsWithContext<StreamChatGenerics>> & {
  attachment: Attachment<StreamChatGenerics>;
};

/**
 * UI component for card in attachments.
 */
export const Giphy = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GiphyProps<StreamChatGenerics>,
) => {
  const { handleAction, isMyMessage, message, onLongPress, onPress, onPressIn, preventPress } =
    useMessageContext<StreamChatGenerics>();
  const { additionalTouchableProps, giphyVersion } = useMessagesContext<StreamChatGenerics>();
  const { setImage, setImages } = useImageGalleryContext<StreamChatGenerics>();
  const { setOverlay } = useOverlayContext();
  return (
    <MemoizedGiphy
      {...{
        additionalTouchableProps,
        giphyVersion,
        handleAction,
        isMyMessage,
        message,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setImage,
        setImages,
        setOverlay,
      }}
      {...props}
    />
  );
};

Giphy.displayName = 'Giphy{messageSimple{giphy}}';
