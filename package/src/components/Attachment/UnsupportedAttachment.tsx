import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import { FileIconProps } from './FileIcon';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export type UnsupportedAttachmentProps = Partial<
  Pick<MessagesContextValue, 'FileAttachmentIcon'>
> & {
  /** The attachment to render */
  attachment: Attachment;
  attachmentIconSize?: FileIconProps['size'];
};

export const UnsupportedAttachment = (props: UnsupportedAttachmentProps) => {
  const { FileAttachmentIcon: FileAttachmentIconDefault } = useMessagesContext();
  const { attachment, attachmentIconSize, FileAttachmentIcon = FileAttachmentIconDefault } = props;

  const styles = useStyles();

  const {
    theme: {
      messageSimple: {
        unsupportedAttachment: { container, details, title },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <FileAttachmentIcon mimeType={attachment.mime_type} size={attachmentIconSize} />
      <View style={[styles.details, details]}>
        <Text numberOfLines={2} style={[styles.title, title]}>
          {attachment.title ?? t('Unsupported Attachment')}
        </Text>
      </View>
    </View>
  );
};

UnsupportedAttachment.displayName = 'UnsupportedAttachment{messageSimple{file}}';

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
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
