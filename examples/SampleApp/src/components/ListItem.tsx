import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native';

type ListItemProps = {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

export const ListItem = React.memo(
  ({ icon, label, destructive = false, onPress, trailing }: ListItemProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    const labelColor = destructive ? semantics.accentError : semantics.textPrimary;

    return (
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.outerContainer, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.contentContainer}>
          {icon}
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
      </Pressable>
    );
  },
);

ListItem.displayName = 'ListItem';

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        outerContainer: {
          minHeight: 40,
          paddingHorizontal: 4,
        },
        contentContainer: {
          alignItems: 'center',
          borderRadius: 12,
          flexDirection: 'row',
          gap: 12,
          padding: 12,
        },
        label: {
          flex: 1,
          fontSize: 17,
          fontWeight: '400',
          lineHeight: 20,
        },
        trailing: {
          flexShrink: 0,
        },
      }),
    [],
  );
