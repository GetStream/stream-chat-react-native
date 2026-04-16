import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from 'stream-chat-react-native';

type SectionCardProps = ViewProps & {
  children: React.ReactNode;
};

export const SectionCard = React.memo(({ children, style, ...rest }: SectionCardProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const themedStyles = useThemedStyles();

  return (
    <View style={[themedStyles.container, { backgroundColor: semantics.backgroundCoreSurfaceCard }, style]} {...rest}>
      {children}
    </View>
  );
});

SectionCard.displayName = 'SectionCard';

const useThemedStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: 12,
          overflow: 'hidden',
          paddingVertical: 8,
        },
      }),
    [],
  );
