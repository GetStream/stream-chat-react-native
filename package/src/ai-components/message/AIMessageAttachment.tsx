import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAITranslation, useTheme } from '../contexts';
import { type AIIcons, useAIIcons } from '../icons';
import { primitives } from '../internal/tokens';

/**
 * What a message carries besides its text, such as an image or a file. The counterpart of
 * `AIMessageAttachment` in StreamChatAI.
 */
export type AIMessageAttachmentData = {
  /** `image` shows a thumbnail; `file` shows its name, type and size. An open set. */
  kind: 'image' | 'file' | (string & {});
  /** Data of its own, such as what an attachment of a kind of your own needs. */
  extraData?: Record<string, unknown>;
  /** Its media type, such as `application/pdf`. Without it, the type comes from its name or URL. */
  mimeType?: string;
  /** Its name, such as the file's. */
  name?: string;
  /** Its size, in bytes. */
  size?: number;
  /** Where it is: a web URL, or a local one of something the app holds, such as a photo just picked. */
  url?: string;
};

/** The extension of its name, else of its URL. */
const pathExtensionOf = (attachment: AIMessageAttachmentData) => {
  for (const candidate of [attachment.name, attachment.url]) {
    if (!candidate) continue;
    const path = candidate.split(/[?#]/)[0] ?? '';
    const file = path.split('/').pop() ?? '';
    const dot = file.lastIndexOf('.');
    if (dot > 0 && dot < file.length - 1) return file.slice(dot + 1);
  }
  return undefined;
};

const extensionOf = (attachment: AIMessageAttachmentData) =>
  pathExtensionOf(attachment) ?? attachment.mimeType?.split('/')[1]?.split(/[+;]/)[0];

const ARCHIVE_EXTENSIONS = ['7z', 'bz2', 'gz', 'rar', 'tar', 'tgz', 'xz', 'zip'];
const ARCHIVE_SUBTYPES = [
  'gzip',
  'vnd.rar',
  'x-7z-compressed',
  'x-bzip2',
  'x-rar-compressed',
  'x-tar',
  'zip',
];
const AUDIO_EXTENSIONS = ['aac', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav'];
const IMAGE_EXTENSIONS = ['bmp', 'gif', 'heic', 'heif', 'jpeg', 'jpg', 'png', 'svg', 'webp'];
const VIDEO_EXTENSIONS = ['avi', 'm4v', 'mkv', 'mov', 'mp4', 'webm'];

/**
 * The icon of a file's type, from its media type, else from the extension of its name or URL, as
 * in StreamChatAI and the Android AI SDK.
 */
const fileTypeIcon = (
  attachment: AIMessageAttachmentData,
): keyof Pick<AIIcons, 'Archive' | 'Audio' | 'File' | 'Image' | 'Pdf' | 'Video'> => {
  const [type, subtype] = attachment.mimeType?.toLowerCase().split(';')[0]?.trim().split('/') ?? [];
  const extension = pathExtensionOf(attachment)?.toLowerCase();
  const is = (wanted: string, extensions: string[]) =>
    type ? type === wanted : !!extension && extensions.includes(extension);
  if (type ? subtype === 'pdf' : extension === 'pdf') return 'Pdf';
  if (is('image', IMAGE_EXTENSIONS)) return 'Image';
  if (is('audio', AUDIO_EXTENSIONS)) return 'Audio';
  if (is('video', VIDEO_EXTENSIONS)) return 'Video';
  if (
    type
      ? !!subtype && ARCHIVE_SUBTYPES.includes(subtype)
      : !!extension && ARCHIVE_EXTENSIONS.includes(extension)
  ) {
    return 'Archive';
  }
  return !type && !extension && attachment.kind === 'image' ? 'Image' : 'File';
};

const FILE_SIZE_UNITS = ['B', 'kB', 'MB', 'GB'];

/** A size in bytes to three significant digits, such as "2.34 MB", as the chat SDK writes it. */
export const formatFileSize = (bytes: number) => {
  const exponent =
    bytes <= 0
      ? 0
      : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), FILE_SIZE_UNITS.length - 1);
  const mantissa = bytes / 1024 ** exponent;
  // `toPrecision` turns exponential past three integer digits (1000–1023 of a unit).
  const formatted = mantissa >= 1000 ? Math.round(mantissa).toString() : mantissa.toPrecision(3);
  return `${formatted} ${FILE_SIZE_UNITS[exponent]}`;
};

/** Its type and size, such as "PDF · 2.34 MB". */
export const attachmentDetails = (attachment: AIMessageAttachmentData) =>
  [
    extensionOf(attachment)?.toUpperCase(),
    attachment.size !== undefined ? formatFileSize(attachment.size) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

// Only a web URL opens; anything else, such as a local file, a data URL or `javascript:`, doesn't.
const isWebUrl = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url);

const open = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

export type AIMessageAttachmentProps = {
  attachment: AIMessageAttachmentData;
  /** Who sent it. */
  role?: 'user' | 'assistant' | (string & {});
};

/**
 * An image or a file on a message: an image as a thumbnail, a file with its type's icon, name, type
 * and size. A file at a web URL opens in the browser when tapped; an image doesn't open, as in
 * StreamChatAI and the Android AI SDK. The counterpart of `AIMessageAttachmentView`.
 */
export const AIMessageAttachment = ({
  attachment,
  role = 'assistant',
}: AIMessageAttachmentProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, message },
  } = useTheme();
  const styles = message?.attachment;
  const icons = useAIIcons();
  const { url } = attachment;
  const name =
    attachment.name ||
    (url && !url.startsWith('data:') ? url.split(/[?#]/)[0]?.split('/').pop() : undefined) ||
    (attachment.kind === 'image' ? t('Image') : t('File'));

  if (attachment.kind === 'image' && url) {
    return (
      <View
        accessibilityLabel={name}
        accessibilityRole='image'
        accessible
        style={[
          defaultStyles.image,
          { backgroundColor: message?.attachmentImagePlaceholder ?? colors.grey_whisper },
          styles?.image,
        ]}
        testID={`ai-message-attachment-${role}`}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode='cover'
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  const details = attachmentDetails(attachment);
  const TypeIcon = icons[fileTypeIcon(attachment)];
  const content = (
    <>
      <View
        style={[
          defaultStyles.fileIcon,
          { backgroundColor: message?.attachmentIconBackground ?? colors.accent_blue },
          styles?.fileIcon,
        ]}
      >
        <TypeIcon color={message?.attachmentIcon ?? colors.white} size={20} />
      </View>
      <View style={defaultStyles.fileText}>
        <Text
          ellipsizeMode='middle'
          numberOfLines={1}
          style={[
            defaultStyles.fileName,
            { color: message?.attachmentName ?? colors.black },
            styles?.fileName,
          ]}
        >
          {name}
        </Text>
        {details ? (
          <Text
            numberOfLines={1}
            style={[
              defaultStyles.fileDetails,
              { color: message?.attachmentDetails ?? colors.grey },
              styles?.fileDetails,
            ]}
          >
            {details}
          </Text>
        ) : null}
      </View>
    </>
  );
  const fileStyle = [
    defaultStyles.file,
    {
      backgroundColor: message?.attachmentBackground ?? colors.white,
      borderColor: message?.attachmentBorder ?? colors.grey_gainsboro,
    },
    styles?.file,
  ];

  return isWebUrl(url) ? (
    <Pressable
      accessibilityRole='link'
      onPress={() => open(url)}
      style={({ pressed }) => [fileStyle, { opacity: pressed ? 0.7 : 1 }]}
      testID={`ai-message-attachment-${role}`}
    >
      {content}
    </Pressable>
  ) : (
    <View accessible style={fileStyle} testID={`ai-message-attachment-${role}`}>
      {content}
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  // The Android AI SDK's card: a 36 tile with a 20 icon, 8 padding, 10 apart, at most 280 wide.
  file: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    maxWidth: 280,
    padding: 8,
  },
  fileDetails: { fontSize: primitives.typographyFontSizeXs },
  fileIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  fileName: { fontSize: primitives.typographyFontSizeSm, fontWeight: '600' },
  fileText: { flexShrink: 1 },
  image: { borderRadius: 16, height: 180, overflow: 'hidden', width: 180 },
});
