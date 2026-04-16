import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type DateHeaderProps = {
  dateString?: string | number;
};

export const DateHeader = ({ dateString }: DateHeaderProps) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{dateString}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      dateHeader: { container, text },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignSelf: 'center',
        borderRadius: primitives.radiusMax,
        paddingHorizontal: primitives.spacingSm,
        paddingVertical: primitives.spacingXxs,
        backgroundColor: semantics.backgroundCoreSurfaceSubtle,
        ...container,
      },
      text: {
        color: semantics.chatTextSystem,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...text,
      },
    });
  }, [semantics, container, text]);
};
