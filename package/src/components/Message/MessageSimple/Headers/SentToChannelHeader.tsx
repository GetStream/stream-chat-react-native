import React, { useMemo } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMessage } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../../contexts/channelContext/ChannelContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { ArrowUpRight } from '../../../../icons/ArrowUpRight';
import { primitives } from '../../../../theme';

type SentToChannelHeaderPropsWithContext = Pick<ThreadContextValue, 'onBackPressThread'> &
  Pick<ChannelContextValue, 'threadList' | 'channel' | 'setTargetedMessage'> &
  Pick<MessageContextValue, 'onThreadSelect' | 'message'>;

const SentToChannelHeaderWithContext = (props: SentToChannelHeaderPropsWithContext) => {
  const { onBackPressThread, threadList, onThreadSelect, message, channel, setTargetedMessage } =
    props;
  const {
    theme: { semantics },
  } = useTheme();
  const { t } = useTranslationContext();
  const styles = useStyles();

  const queryParentMessageAndMoveToTargetedMessage = () => {
    return channel
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
  };

  const handleOnPress = async () => {
    if (!threadList) {
      await queryParentMessageAndMoveToTargetedMessage();
    } else {
      setTargetedMessage(message.id);
      onBackPressThread?.(message.id);
    }
  };

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <ArrowUpRight height={16} width={16} stroke={semantics.textPrimary} />
      <Text style={styles.label}>
        {threadList ? t('Also sent in channel') : t('Replied to a thread')}
      </Text>
      {(!threadList && onThreadSelect) || (threadList && onBackPressThread) ? (
        <>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={handleOnPress}>
            <Text style={styles.link}>{t('View')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
};

const areEqual = (
  prevProps: SentToChannelHeaderPropsWithContext,
  nextProps: SentToChannelHeaderPropsWithContext,
) => {
  const { threadList: prevThreadList } = prevProps;
  const { threadList: nextThreadList } = nextProps;
  if (prevThreadList !== nextThreadList) {
    return false;
  }
  return true;
};

const MemoizedSentToChannelHeader = React.memo(
  SentToChannelHeaderWithContext,
  areEqual,
) as typeof SentToChannelHeaderWithContext;

export type SentToChannelHeaderProps = Partial<SentToChannelHeaderPropsWithContext>;

export const SentToChannelHeader = (props: SentToChannelHeaderProps) => {
  const { onBackPressThread } = useThreadContext();
  const { threadList, channel, setTargetedMessage } = useChannelContext();
  const { onThreadSelect, message } = useMessageContext();

  return (
    <MemoizedSentToChannelHeader
      onBackPressThread={onBackPressThread}
      threadList={threadList}
      onThreadSelect={onThreadSelect}
      message={message}
      channel={channel}
      setTargetedMessage={setTargetedMessage}
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
