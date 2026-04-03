import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChannelPreviewMutedStatus, useTheme } from 'stream-chat-react-native';

type ChannelDetailProfileSectionProps = {
  avatar: React.ReactNode;
  muted?: boolean;
  subtitle: string;
  title: string;
};

export const ChannelDetailProfileSection = React.memo(
  ({ avatar, muted, subtitle, title }: ChannelDetailProfileSectionProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    return (
      <View style={styles.container}>
        {avatar}
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: semantics.textPrimary }]} numberOfLines={2}>
              {title}
            </Text>
            {muted ? <ChannelPreviewMutedStatus /> : null}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: semantics.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    );
  },
);

ChannelDetailProfileSection.displayName = 'ChannelDetailProfileSection';

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 0,
        },
        heading: {
          alignItems: 'center',
          gap: 8,
          width: '100%',
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 4,
          justifyContent: 'center',
          maxWidth: '100%',
        },
        title: {
          fontSize: 22,
          flexShrink: 1,
          fontWeight: '600',
          lineHeight: 24,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 15,
          fontWeight: '400',
          lineHeight: 20,
          textAlign: 'center',
        },
      }),
    [],
  );
