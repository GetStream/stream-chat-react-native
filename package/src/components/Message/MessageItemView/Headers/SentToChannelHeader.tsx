import React, { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageContext } from '../../../../contexts/messageContext/MessageContext';
import { useMessagesContext } from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../../hooks';
import { primitives } from '../../../../theme';
import { useOpenThreadAtMessage } from '../../hooks/useOpenThreadAtMessage';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

type SentToChannelHeaderPropsWithContext = Pick<ThreadContextValue, 'thread'> & {
  /** Called when the header is pressed. */
  onPress: () => void;
  /**
   * Whether to show the "view" text.
   * @default false
   */
  showViewText?: boolean;
};

const SentToChannelHeaderWithContext = (props: SentToChannelHeaderPropsWithContext) => {
  const { onPress, showViewText, thread } = props;
  const { t } = useTranslationContext();
  const styles = useStyles();
  const { icons } = useComponentsContext();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <icons.ArrowUpRight height={16} width={16} stroke={styles.link.color} />
      <Text style={styles.label}>
        {thread
          ? t('message.sentToChannelHeader.alsoSent.text', 'Also sent in channel')
          : t('message.sentToChannelHeader.repliedToThread.text', 'Replied to a thread')}
      </Text>
      {showViewText ? (
        <>
          <Text
            accessibilityElementsHidden
            importantForAccessibility='no-hide-descendants'
            style={styles.dot}
          >
            ·
          </Text>
          <Pressable onPress={onPress} testID='sent-to-channel-header-view-button'>
            <Text style={styles.link}>{t('message.sentToChannelHeader.view.label', 'View')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
};

const MemoizedSentToChannelHeader = React.memo(
  SentToChannelHeaderWithContext,
) as typeof SentToChannelHeaderWithContext;

export type SentToChannelHeaderProps = Partial<SentToChannelHeaderPropsWithContext>;

export const SentToChannelHeader = (props: SentToChannelHeaderProps) => {
  const { onAlsoSentToChannelHeaderPress } = useMessagesContext();
  const { thread } = useThreadContext();
  const { message } = useMessageContext();
  const openThreadAtMessage = useOpenThreadAtMessage();

  const handleOnPress = useStableCallback(async () => {
    if (thread) {
      onAlsoSentToChannelHeaderPress?.({ targetedMessageId: message.id });
      return;
    }

    if (message.parent_id) {
      await openThreadAtMessage({ parentId: message.parent_id, targetedMessageId: message.id });
    }
  });

  const showViewText = useMemo(() => {
    return !!onAlsoSentToChannelHeaderPress;
  }, [onAlsoSentToChannelHeaderPress]);

  return (
    <MemoizedSentToChannelHeader
      onPress={handleOnPress}
      showViewText={showViewText}
      thread={thread}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageItemView: {
        sentToChannelHeader: { container, label, dot, link },
      },
    },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
        paddingVertical: primitives.spacingXxs,
        ...container,
      },
      label: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
      dot: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...dot,
      },
      link: {
        color: shouldUseOverlayStyles
          ? semantics.buttonPrimaryTextOnAccent
          : semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...link,
      },
    });
  }, [shouldUseOverlayStyles, container, semantics, label, dot, link]);
};
