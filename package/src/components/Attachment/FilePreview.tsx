import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import type { Attachment } from 'stream-chat';

import { FileIcon as FileIconDefault, FileIconProps } from '../../components/Attachment/FileIcon';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { getDurationLabelFromDuration, getFileSizeDisplayText } from '../../utils/utils';

export type FilePreviewProps = Partial<Pick<MessagesContextValue, 'FileAttachmentIcon'>> & {
  /** The attachment to render */
  attachment: Attachment;
  attachmentIconSize?: FileIconProps['size'];
  // TODO: Think we really need a way to style the file preview using props if we have theme.
  styles?: Partial<{
    container: StyleProp<ViewStyle>;
    details: StyleProp<ViewStyle>;
    size: StyleProp<TextStyle>;
    title: StyleProp<TextStyle>;
  }>;
  titleNumberOfLines?: number;
  indicator?: React.ReactNode;
};

export const FilePreview = (props: FilePreviewProps) => {
  const {
    attachment,
    FileAttachmentIcon: PropFileAttachmentIcon,
    attachmentIconSize,
    styles: stylesProp = {},
    titleNumberOfLines = 2,
    indicator,
  } = props;
  const { FileAttachmentIcon: ContextFileAttachmentIcon } = useMessagesContext();
  const FileAttachmentIcon = PropFileAttachmentIcon || ContextFileAttachmentIcon || FileIconDefault;

  const styles = useStyles();

  const {
    theme: {
      messageSimple: {
        file: { container, details, fileSize, title },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      <FileAttachmentIcon mimeType={attachment.mime_type} size={attachmentIconSize} />
      <View style={[styles.details, details, stylesProp.details]}>
        <Text numberOfLines={titleNumberOfLines} style={[styles.title, title, stylesProp.title]}>
          {attachment.title}
        </Text>
        {indicator ? (
          indicator
        ) : (
          <Text style={[styles.size, fileSize, stylesProp.size]}>
            {attachment.duration
              ? getDurationLabelFromDuration(attachment.duration)
              : getFileSizeDisplayText(attachment.file_size)}
          </Text>
        )}
      </View>
    </View>
  );
};

FilePreview.displayName = 'FilePreview{messageSimple{file}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: primitives.spacingSm,
        gap: primitives.spacingSm,
        width: 256, // TODO: Fix this
      },
      details: {
        flexShrink: 1,
        gap: primitives.spacingXxs,
      },
      size: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
