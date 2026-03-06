import React, { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMessage } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../../contexts/channelContext/ChannelContext';
import { useMessageContext } from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../../hooks';
import { ArrowUpRight } from '../../../../icons/ArrowUpRight';
import { primitives } from '../../../../theme';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

type SentToChannelHeaderPropsWithContext = Pick<ChannelContextValue, 'threadList'> & {
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
  const { threadList, onPress, showViewText } = props;
  const { t } = useTranslationContext();
  const styles = useStyles();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <ArrowUpRight height={16} width={16} stroke={styles.link.color} />
      <Text style={styles.label}>
        {threadList ? t('Also sent in channel') : t('Replied to a thread')}
      </Text>
      {showViewText ? (
        <>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={onPress}>
            <Text style={styles.link}>{t('View')}</Text>
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
  const { onAlsoSentToChannelHeaderPress } = useThreadContext();
  const { channel, threadList } = useChannelContext();
  const { message } = useMessageContext();

  // TODO: V9: This should be handled by the channel/thread entirely. We should only fetch
  //           if we don't have the message in state already.
  const handleOnPress = useStableCallback(async () => {
    if (threadList) {
      onAlsoSentToChannelHeaderPress?.({ targetedMessageId: message.id });
      return;
    }

    if (!message.parent_id) {
      return;
    }

    try {
      const { messages } = await channel.getMessagesById([message.parent_id]);
      const parentThreadMessage = formatMessage(messages?.[0]);

      if (!parentThreadMessage) {
        return;
      }

      onAlsoSentToChannelHeaderPress?.({
        parentMessage: formatMessage(parentThreadMessage),
        targetedMessageId: message.id,
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
      threadList={threadList}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
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
