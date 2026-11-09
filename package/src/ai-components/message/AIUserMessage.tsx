import React, { type ComponentType } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AIMessageAttachment,
  type AIMessageAttachmentData,
  type AIMessageAttachmentProps,
} from './AIMessageAttachment';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { primitives } from '../internal/tokens';

export type AIUserMessageProps = {
  /** What the person wrote. */
  text: string;
  /** Shows each attachment, instead of `AIMessageAttachment`, such as for a kind of your own. */
  Attachment?: ComponentType<AIMessageAttachmentProps>;
  /** What they sent with it, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  /** Edits the message, such as by putting its text back in the composer. Without it, no edit button. */
  onEdit?: () => void;
};

/**
 * The person's message: its attachments, then its text in a bubble on the trailing side.
 */
export const AIUserMessage = ({
  Attachment = AIMessageAttachment,
  attachments = [],
  onEdit,
  text,
}: AIUserMessageProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, message },
  } = useTheme();
  const { Edit } = useAIIcons();
  const styles = message?.userMessage;

  return (
    <View style={[defaultStyles.container, styles?.container]} testID='ai-user-message'>
      {attachments.length > 0 ? (
        <View style={[defaultStyles.attachments, styles?.attachments]}>
          {attachments.map((attachment, index) => (
            <Attachment attachment={attachment} key={index} role='user' />
          ))}
        </View>
      ) : null}
      {text !== '' ? (
        <View style={defaultStyles.row}>
          {onEdit ? (
            <Pressable
              accessibilityLabel={t('Edit')}
              accessibilityRole='button'
              hitSlop={8}
              onPress={onEdit}
              style={({ pressed }) => [
                defaultStyles.editButton,
                { opacity: pressed ? 0.5 : 1 },
                styles?.editButton,
              ]}
            >
              <Edit color={colors.grey} size={16} />
            </Pressable>
          ) : null}
          <View
            style={[
              defaultStyles.bubble,
              { backgroundColor: message?.userMessageBackground ?? USER_MESSAGE_BACKGROUND },
              styles?.bubble,
            ]}
          >
            <Text
              selectable
              style={[
                defaultStyles.text,
                { color: message?.userMessageText ?? USER_MESSAGE_TEXT },
                styles?.text,
              ]}
            >
              {text}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

// The design tokens' default surface and text.
const USER_MESSAGE_BACKGROUND = '#EBEEF1';
const USER_MESSAGE_TEXT = '#1A1B25';

const defaultStyles = StyleSheet.create({
  // One under the other.
  attachments: { alignItems: 'flex-end', gap: 8 },
  bubble: {
    borderRadius: 20,
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  container: {
    alignItems: 'flex-end',
    gap: 8,
    paddingStart: 48,
  },
  editButton: { padding: 4 },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
  },
  text: {
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightRelaxed,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
