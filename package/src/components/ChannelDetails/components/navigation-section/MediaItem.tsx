import React, { useMemo, useRef } from 'react';
import { findNodeHandle, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment, MessageResponse } from 'stream-chat';

import { useChatConfigContext } from '../../../../contexts/chatConfigContext/ChatConfigContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../../icons/video-fill';
import { primitives } from '../../../../theme';
import { FileTypes } from '../../../../types/types';
import { getResizedImageUrl } from '../../../../utils/getResizedImageUrl';
import { getUrlOfImageAttachment } from '../../../../utils/getUrlOfImageAttachment';
import { getDurationLabelFromDuration } from '../../../../utils/utils';
import { UserAvatar } from '../../../ui/Avatar/UserAvatar';

/**
 * The shape passed to `MediaItem`'s `onPress` callback, identifying the rendered attachment, the
 * message it belongs to, and the tile's native node handle (used as the open-animation origin when
 * launching the fullscreen image gallery).
 *
 * @experimental This type is experimental and is subject to change.
 */
export type MediaItemPressParams = {
  attachment: Attachment;
  message: MessageResponse;
  requesterNode: number | null;
};

export type MediaItemProps = {
  /** The image/video attachment rendered by this tile. */
  attachment: Attachment;
  /** The message the attachment belongs to. */
  message: MessageResponse;
  /** Side length of the square tile, in points. */
  size: number;
  /**
   * Fired with the tile's attachment and message when the tile is pressed. The media list passes
   * its gallery-opening handler here via `renderItem`.
   */
  onPress?: (params: MediaItemPressParams) => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const MediaItem = (props: MediaItemProps) => {
  const { ImageComponent: Image } = useComponentsContext();
  const { attachment, message, onPress, size } = props;
  const {
    theme: {
      channelDetails: { mediaItem },
      semantics,
    },
  } = useTheme();
  const { resizableCDNHosts } = useChatConfigContext();
  const styles = useStyles();
  const containerRef = useRef<View>(null);

  const isVideo = attachment.type === FileTypes.Video;
  const url = attachment.thumb_url || getUrlOfImageAttachment(attachment);
  const thumbnailUrl = url
    ? getResizedImageUrl({ height: size, resizableCDNHosts, url, width: size })
    : undefined;
  const durationLabel = isVideo
    ? getDurationLabelFromDuration(attachment.duration ?? 0)
    : undefined;

  return (
    <Pressable
      onPress={
        onPress
          ? () =>
              onPress({ attachment, message, requesterNode: findNodeHandle(containerRef.current) })
          : undefined
      }
      ref={containerRef}
      style={[
        styles.container,
        { backgroundColor: semantics.backgroundCoreSurfaceStrong, width: size },
        mediaItem.container,
      ]}
      testID={`media-item-${message.id}`}
    >
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={[styles.thumbnail, mediaItem.thumbnail]}
          testID='media-item-thumbnail'
        />
      ) : null}
      {message.user ? (
        <UserAvatar size='sm' style={[styles.avatar, mediaItem.avatar]} user={message.user} />
      ) : null}
      {isVideo ? (
        <View
          style={[
            styles.videoBadge,
            { backgroundColor: semantics.badgeBgInverse },
            mediaItem.videoBadge,
          ]}
        >
          <Recorder fill={semantics.badgeTextOnInverse} size={12} />
          <Text
            style={[
              styles.videoBadgeText,
              { color: semantics.badgeTextOnInverse },
              mediaItem.videoBadgeText,
            ]}
          >
            {durationLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

MediaItem.displayName = 'MediaItem{mediaItem}';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        avatar: {
          left: primitives.spacingXs,
          position: 'absolute',
          top: primitives.spacingXs,
        },
        container: {
          aspectRatio: 1,
          borderRadius: primitives.radiusXxs,
          overflow: 'hidden',
        },
        thumbnail: {
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        videoBadge: {
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          bottom: primitives.spacingXs,
          flexDirection: 'row',
          gap: primitives.spacingXxs,
          left: primitives.spacingXs,
          paddingHorizontal: primitives.spacingXs,
          paddingVertical: primitives.spacingXxs,
          position: 'absolute',
        },
        videoBadgeText: {
          fontSize: primitives.typographyFontSizeXxs,
          fontWeight: primitives.typographyFontWeightBold,
        },
      }),
    [],
  );
};
