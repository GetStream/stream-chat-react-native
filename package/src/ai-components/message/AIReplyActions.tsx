import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { useAITranslation, useTheme } from '../contexts';
import { type AIIcon, useAIIcons } from '../icons';
import { setClipboardString } from '../services/clipboard-service';

/** How the person rated a reply. */
export type AIMessageRating = 'positive' | 'negative';

export type AIReplyActionsProps = {
  /** The reply's text, which copying and sharing hand on. */
  text: string;
  /** Rates the reply, or takes the rating back with `null`. Without it, no rating is offered. */
  onRate?: (rating: AIMessageRating | null) => void;
  /** Asks the agent for a new reply in its place. Without it, no regenerate button. */
  onRegenerate?: () => void;
  /** How the person rated the reply, if they did. */
  rating?: AIMessageRating | null;
};

/** How long the copy button shows its check. */
const COPIED_MS = 1500;

type ActionProps = {
  Icon: AIIcon;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

const Action = ({ Icon, label, onPress, selected }: ActionProps) => {
  const {
    theme: { colors, message },
  } = useTheme();
  const styles = message?.replyActions;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole='button'
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        defaultStyles.button,
        { opacity: pressed ? 0.5 : 1 },
        styles?.button,
      ]}
    >
      <Icon color={message?.messageAction ?? colors.grey_dark} size={18} />
    </Pressable>
  );
};

/**
 * The actions under a finished reply: copy (when the app has a clipboard module), share through
 * the system's share sheet, regenerate, and a thumbs up or down rating.
 */
export const AIReplyActions = ({ onRate, onRegenerate, rating, text }: AIReplyActionsProps) => {
  const { t } = useAITranslation();
  const {
    theme: { message },
  } = useTheme();
  const icons = useAIIcons();
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A list that reuses this view for another reply: what was copied was the other reply.
  const [replyText, setReplyText] = useState(text);
  if (replyText !== text) {
    setReplyText(text);
    setIsCopied(false);
  }

  // A reply that answers only in UI or attachments has no text to copy or share.
  const hasText = text.trim() !== '';
  const setString = setClipboardString;
  const copy =
    setString && hasText
      ? () => {
          setString(text);
          setIsCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setIsCopied(false), COPIED_MS);
        }
      : undefined;

  // The person closing the share sheet resolves too; there's nothing to do either way.
  const share = () => {
    Share.share({ message: text }).catch(() => undefined);
  };

  const positive = rating === 'positive';
  const negative = rating === 'negative';

  if (!hasText && !onRegenerate && !onRate) return null;

  return (
    <View
      accessibilityLabel={t(
        'aiComponents.replyActions.replyActions.accessibilityLabel',
        'Reply actions',
      )}
      accessibilityRole='toolbar'
      style={[defaultStyles.container, message?.replyActions?.container]}
      testID='ai-reply-actions'
    >
      {copy ? (
        <Action
          Icon={isCopied ? icons.Copied : icons.Copy}
          label={
            isCopied
              ? t('aiComponents.replyActions.copied.accessibilityLabel', 'Copied')
              : t('aiComponents.replyActions.copy.accessibilityLabel', 'Copy')
          }
          onPress={copy}
        />
      ) : null}
      {hasText ? (
        <Action
          Icon={icons.Share}
          label={t('aiComponents.replyActions.share.accessibilityLabel', 'Share')}
          onPress={share}
        />
      ) : null}
      {onRegenerate ? (
        <Action
          Icon={icons.Regenerate}
          label={t('aiComponents.replyActions.regenerate.accessibilityLabel', 'Regenerate')}
          onPress={onRegenerate}
        />
      ) : null}
      {onRate ? (
        <>
          <Action
            Icon={positive ? icons.ThumbsUpFilled : icons.ThumbsUp}
            label={t('aiComponents.replyActions.goodResponse.accessibilityLabel', 'Good response')}
            onPress={() => onRate(positive ? null : 'positive')}
            selected={positive}
          />
          <Action
            Icon={negative ? icons.ThumbsDownFilled : icons.ThumbsDown}
            label={t('aiComponents.replyActions.badResponse.accessibilityLabel', 'Bad response')}
            onPress={() => onRate(negative ? null : 'negative')}
            selected={negative}
          />
        </>
      ) : null}
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  // 40 buttons, 8 apart, with 18 icons.
  button: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  container: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
