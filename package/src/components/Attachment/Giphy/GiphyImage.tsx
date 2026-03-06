import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import { ChatContextValue, useChatContext } from '../../../contexts/chatContext/ChatContext';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useLoadingImage } from '../../../hooks/useLoadingImage';

import { makeImageCompatibleUrl } from '../../../utils/utils';
import { GiphyBadge } from '../../ui/Badge/GiphyBadge';

export type GiphyImagePropsWithContext = Pick<ChatContextValue, 'ImageComponent'> &
  Pick<
    MessagesContextValue,
    'giphyVersion' | 'ImageLoadingIndicator' | 'ImageLoadingFailedIndicator'
  > & {
    attachment: Attachment;
    /**
     * Whether to render the preview image or the full image
     */
    preview?: boolean;
  };

const GiphyImageWithContext = (props: GiphyImagePropsWithContext) => {
  const {
    attachment,
    giphyVersion,
    ImageComponent = Image,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    preview = false,
  } = props;

  const { giphy: giphyData, image_url, thumb_url, type } = attachment;

  const {
    isLoadingImage,
    isLoadingImageError,
    setLoadingImage,
    setLoadingImageError,
    onReloadImage,
  } = useLoadingImage();

  const {
    theme: {
      messageSimple: {
        giphy: { giphyMask, giphy, imageIndicatorContainer },
      },
    },
  } = useTheme();

  const styles = useStyles();

  const onLoadStart = () => {
    setLoadingImage(true);
    setLoadingImageError(false);
  };

  const onLoadEnd = () => {
    setLoadingImage(false);
  };

  const onError = () => {
    setLoadingImage(false);
    setLoadingImageError(true);
  };

  let uri = image_url || thumb_url;
  const giphyDimensions: { height?: number; width?: number } = {};

  if (type === 'giphy' && giphyData) {
    const giphyVersionInfo = giphyData[giphyVersion];
    uri = giphyVersionInfo.url;
    giphyDimensions.height = parseFloat(giphyVersionInfo.height);
    giphyDimensions.width = parseFloat(giphyVersionInfo.width);
  }

  if (!uri) {
    return null;
  }

  return (
    <View style={styles.imageContainer}>
      <ImageComponent
        accessibilityLabel={preview ? 'Giphy Attachment Preview Image' : 'Giphy Attachment Image'}
        onError={onError}
        onLoadEnd={onLoadEnd}
        onLoadStart={onLoadStart}
        resizeMode='contain'
        source={{ uri: makeImageCompatibleUrl(uri) }}
        style={[styles.giphy, giphyDimensions, giphy]}
      />
      {isLoadingImageError && (
        <View style={[styles.imageIndicatorContainer, imageIndicatorContainer]}>
          <ImageLoadingFailedIndicator onReloadImage={onReloadImage} />
        </View>
      )}
      {isLoadingImage && (
        <View style={[styles.imageIndicatorContainer, imageIndicatorContainer]}>
          <ImageLoadingIndicator />
        </View>
      )}
      <View style={[styles.giphyMask, giphyMask]}>
        <GiphyBadge />
      </View>
    </View>
  );
};

const areEqual = (prevProps: GiphyImagePropsWithContext, nextProps: GiphyImagePropsWithContext) => {
  const {
    attachment: { actions: prevActions, image_url: prevImageUrl, thumb_url: prevThumbUrl },
    giphyVersion: prevGiphyVersion,
  } = prevProps;
  const {
    attachment: { actions: nextActions, image_url: nextImageUrl, thumb_url: nextThumbUrl },
    giphyVersion: nextGiphyVersion,
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

  return true;
};

const MemoizedGiphyImage = React.memo(
  GiphyImageWithContext,
  areEqual,
) as typeof GiphyImageWithContext;

export type GiphyImageProps = Partial<GiphyImagePropsWithContext> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const GiphyImage = (props: GiphyImageProps) => {
  const { ImageComponent } = useChatContext();
  const { giphyVersion } = useMessagesContext();

  const {
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
  } = useMessagesContext();
  const ImageLoadingFailedIndicator =
    ContextImageLoadingFailedIndicator || props.ImageLoadingFailedIndicator;
  const ImageLoadingIndicator = ContextImageLoadingIndicator || props.ImageLoadingIndicator;

  return (
    <MemoizedGiphyImage
      giphyVersion={giphyVersion}
      ImageComponent={ImageComponent}
      ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
      ImageLoadingIndicator={ImageLoadingIndicator}
      {...props}
    />
  );
};

GiphyImage.displayName = 'GiphyImage';

const useStyles = () => {
  return useMemo(() => {
    return StyleSheet.create({
      giphyMask: {
        bottom: 8,
        left: 8,
        position: 'absolute',
      },
      giphy: {
        alignSelf: 'center',
      },
      imageContainer: {},
      imageIndicatorContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
      },
    });
  }, []);
};
