import React, { useCallback, useMemo } from 'react';

import { View, Text, StyleSheet } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import type { LinkPreview } from 'stream-chat';
import { LinkPreviewsManager } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentPreview/AttachmentRemoveControl';

import { useChatContext, useMessageComposer, useTheme } from '../../../contexts';
import { Link } from '../../../icons/Link';
import { components, primitives } from '../../../theme';
import { useLinkPreviews } from '../hooks/useLinkPreviews';

export type LinkPreviewListProps = {
  displayLinkCount?: number;
};

export const LinkPreviewList = ({ displayLinkCount = 1 }: LinkPreviewListProps) => {
  const linkPreviews = useLinkPreviews();

  if (linkPreviews.length === 0) return null;

  return (
    <>
      {linkPreviews.slice(0, displayLinkCount).map((linkPreview) => (
        <LinkPreviewCard key={linkPreview.og_scrape_url} linkPreview={linkPreview} />
      ))}
    </>
  );
};

type LinkPreviewProps = {
  linkPreview: LinkPreview;
};

export const LinkPreviewCard = ({ linkPreview }: LinkPreviewProps) => {
  const styles = useStyles();
  const { ImageComponent } = useChatContext();
  const { linkPreviewsManager } = useMessageComposer();
  const { image_url, thumb_url, title, text, og_scrape_url } = linkPreview;

  const dismissPreview = useCallback(
    () => linkPreviewsManager.dismissPreview(og_scrape_url),
    [linkPreviewsManager, og_scrape_url],
  );

  if (
    !LinkPreviewsManager.previewIsLoaded(linkPreview) &&
    !LinkPreviewsManager.previewIsLoading(linkPreview)
  ) {
    return null;
  }

  return (
    <Animated.View layout={LinearTransition.duration(200)} style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          <ImageComponent source={{ uri: image_url ?? thumb_url }} style={styles.thumbnail} />
        </View>
        <View style={styles.metadataContainer}>
          {title ? (
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.title}>
              {title}
            </Text>
          ) : null}
          {text ? (
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.text}>
              {text}
            </Text>
          ) : null}
          {og_scrape_url ? (
            <View style={styles.linkContainer}>
              <Link
                height={styles.text.fontSize}
                stroke={styles.text.color}
                width={styles.text.fontSize}
                style={styles.linkIcon}
              />
              <Text numberOfLines={1} ellipsizeMode='tail' style={styles.text}>
                {og_scrape_url}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.dismissWrapper}>
        <AttachmentRemoveControl onPress={dismissPreview} />
      </View>
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageInput: { linkPreviewList },
    },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        linkContainer: {
          flexDirection: 'row',
          gap: primitives.spacingXxs,
          ...linkPreviewList.linkContainer,
        },
        linkIcon: { alignSelf: 'center', ...linkPreviewList.linkIcon },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          backgroundColor: semantics.chatBgOutgoing,
          paddingVertical: primitives.spacingXs,
          paddingLeft: primitives.spacingXs,
          paddingRight: primitives.spacingSm,
          borderRadius: components.messageBubbleRadiusAttachment,
          gap: primitives.spacingXs,
          ...linkPreviewList.container,
        },
        imageWrapper: {
          flexDirection: 'row',
          overflow: 'hidden',
          ...linkPreviewList.imageWrapper,
        },
        dismissWrapper: {
          position: 'absolute',
          right: 0,
          top: 0,
          ...linkPreviewList.dismissWrapper,
        },
        thumbnail: {
          borderRadius: primitives.radiusMd,
          height: 40,
          width: 40,
          ...linkPreviewList.thumbnail,
        },
        wrapper: {
          paddingVertical: primitives.spacingXxs,
          ...linkPreviewList.wrapper,
        },
        metadataContainer: {
          flexShrink: 1,
          ...linkPreviewList.metadataContainer,
        },
        text: {
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightTight,
          color: semantics.chatTextOutgoing,
          flexShrink: 1,
          ...linkPreviewList.text,
        },
        title: {
          fontWeight: primitives.typographyFontWeightSemiBold,
          fontSize: primitives.typographyFontSizeXs,
          lineHeight: primitives.typographyLineHeightTight,
          color: semantics.chatTextOutgoing,
          ...linkPreviewList.titleText,
        },
      }),
    [linkPreviewList, semantics],
  );
};
