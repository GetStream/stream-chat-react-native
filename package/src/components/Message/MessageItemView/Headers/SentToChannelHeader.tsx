import React, { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useChannelContext } from '../../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
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
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

type SentToChannelHeaderPropsWithContext = Pick<ThreadContextValue, 'thread'> & {
  /**
   * Function to handle press on the sent to channel header
   * @returns void
   */
  onPress: () => void;
  /**
   * Boolean to show the view text
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
          <Pressable onPress={onPress}>
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
  const { client } = useChatContext();
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();
  const { message } = useMessageContext();

  const handleOnPress = useStableCallback(async () => {
    if (thread) {
      onAlsoSentToChannelHeaderPress?.({ targetedMessageId: message.id });
      return;
    }

    const parentId = message.parent_id;
    if (!parentId) {
      return;
    }

    // The parent is only fetched when neither its thread nor the message itself is loaded. Opening
    // the thread loads whatever else it is missing.
    const registeredThread = client.threads.get(parentId);
    if (registeredThread) {
      onAlsoSentToChannelHeaderPress?.({ targetedMessageId: message.id, thread: registeredThread });
      return;
    }

    try {
      const parentMessage =
        client.messageStore.get(parentId) ??
        (await channel.getMessagesById([parentId])).messages?.[0];

      if (!parentMessage) {
        return;
      }

      onAlsoSentToChannelHeaderPress?.({
        targetedMessageId: message.id,
        thread: client.threads.ensure({ channel, parentMessage }),
      });
    } catch (error) {
      console.error('Error querying parent message:', error);
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
