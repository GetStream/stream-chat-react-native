import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThreadManagerState } from 'stream-chat';

import { useChatContext, useTheme, useTranslationContext } from '../../contexts';
import { useStateStore } from '../../hooks';
import { Loading, Reload } from '../../icons';
import { ExclamationCircle } from '../../icons/ExclamationCircle';
import { primitives } from '../../theme';

const selector = (nextValue: ThreadManagerState) =>
  ({ unseenThreadIds: nextValue.unseenThreadIds }) as const;

export const ThreadListUnreadBanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { unseenThreadIds } = useStateStore(client.threads.state, selector);
  if (!unseenThreadIds.length) {
    return null;
  }

  const handlePress = async () => {
    try {
      setLoading(true);
      await client.threads.reload();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Loading height={20} width={20} />
        <Text style={styles.text}>{t('Loading...')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ExclamationCircle stroke={semantics.textSecondary} height={20} width={20} />
        <Text style={styles.text}>{t("Couldn't load new threads. Tap to retry")}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? semantics.backgroundUtilityPressed
            : semantics.backgroundCoreSurface,
        },
      ]}
    >
      <Reload stroke={semantics.textSecondary} height={20} width={20} />
      <Text style={styles.text}>
        {t('{{count}} new threads', { count: unseenThreadIds.length })}
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
        backgroundColor: semantics.backgroundCoreSurface,
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
