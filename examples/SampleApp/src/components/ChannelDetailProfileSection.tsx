import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native';

type ChannelDetailProfileSectionProps = {
  avatar: React.ReactNode;
  subtitle: string;
  title: string;
};

export const ChannelDetailProfileSection = React.memo(
  ({ avatar, subtitle, title }: ChannelDetailProfileSectionProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    return (
      <View style={styles.container}>
        {avatar}
        <View style={styles.heading}>
          <Text style={[styles.title, { color: semantics.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
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
        title: {
          fontSize: 22,
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
