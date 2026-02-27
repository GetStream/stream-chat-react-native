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
  const {
    theme: { semantics },
  } = useTheme();
  const { t } = useTranslationContext();
  const styles = useStyles();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <ArrowUpRight height={16} width={16} stroke={semantics.textPrimary} />
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
  const { onBackPressThread } = useThreadContext();
  const { threadList, channel, setTargetedMessage } = useChannelContext();
  const { onThreadSelect, message } = useMessageContext();

  const handleOnPress = useStableCallback(async () => {
    if (!threadList) {
      return await channel
        .getClient()
        .search({ cid: channel.cid }, { id: message.parent_id })
        .then(({ results }) => {
          if (!results.length) {
            return;
          }
          const targetMessage = formatMessage(results[0].message);
          onThreadSelect?.(targetMessage, message.id);
        })
        .catch((error) => {
          console.error('Error querying parent message:', error);
        });
    } else {
      setTargetedMessage(message.id);
      onBackPressThread?.(message.id);
    }
  });

  const showViewText = useMemo(() => {
    return !!((!threadList && onThreadSelect) || (threadList && onBackPressThread));
  }, [threadList, onThreadSelect, onBackPressThread]);

  return (
    <MemoizedSentToChannelHeader onPress={handleOnPress} showViewText={showViewText} {...props} />
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
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
      dot: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...dot,
      },
      link: {
        color: semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...link,
      },
    });
  }, [container, semantics, label, dot, link]);
};
