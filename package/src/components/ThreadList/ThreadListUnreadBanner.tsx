import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThreadManagerState } from 'stream-chat';

import { useChatContext, useTheme, useTranslationContext } from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useStateStore } from '../../hooks';
import { primitives } from '../../theme';

const selector = (nextValue: ThreadManagerState) =>
  ({ unseenThreadIds: nextValue.unseenThreadIds }) as const;

// The paginator records a failed reload and clears it on the next successful query.
const lastQueryErrorSelector = (nextValue: { lastQueryError?: Error }) => ({
  lastQueryError: nextValue.lastQueryError,
});

export const ThreadListUnreadBanner = () => {
  const [loading, setLoading] = useState(false);
  const { client } = useChatContext();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { unseenThreadIds } = useStateStore(client.threads.state, selector);
  const { lastQueryError } = useStateStore(client.threads.paginator.state, lastQueryErrorSelector);

  const pressableStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.container,
      {
        backgroundColor: pressed
          ? semantics.backgroundUtilityPressed
          : semantics.backgroundCoreSurfaceDefault,
      },
    ],
    [semantics, styles],
  );

  if (!unseenThreadIds.length) {
    return null;
  }

  const handlePress = async () => {
    setLoading(true);
    try {
      await client.threads.reload();
    } catch {
      // Only with the paginator's `throwErrors`; the error is already in its state.
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <icons.Loading height={20} width={20} />
        <Text style={styles.text}>{t('common.loading.text', 'Loading...')}</Text>
      </View>
    );
  }

  if (lastQueryError) {
    return (
      <Pressable onPress={handlePress} style={pressableStyle}>
        <icons.ExclamationCircle stroke={semantics.textSecondary} height={20} width={20} />
        <Text style={styles.text}>
          {t('threadList.unreadBanner.loadFailed.error', "Couldn't load new threads. Tap to retry")}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={pressableStyle}>
      <icons.Reload stroke={semantics.textSecondary} height={20} width={20} />
      <Text style={styles.text}>
        {t('threadList.unreadBanner.newThreads.label', {
          count: unseenThreadIds.length,
          defaultValue_one: '{{count}} new thread',
          defaultValue_other: '{{count}} new threads',
        })}
      </Text>
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, threadListUnreadBanner },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      text: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...threadListUnreadBanner.text,
      },
      container: {
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: primitives.spacingSm,
        gap: primitives.spacingXs,
        ...threadListUnreadBanner.container,
      },
    });
  }, [semantics, threadListUnreadBanner]);
};
