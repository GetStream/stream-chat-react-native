import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Giphy } from '../../../icons/Giphy';
import { primitives } from '../../../theme';

export const GiphyBadge = () => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Giphy height={12} width={12} />
      <Text style={styles.text}>GIPHY</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.badgeBgOverlay,
        borderRadius: primitives.radiusLg,
        gap: primitives.spacingXxs,
        paddingHorizontal: primitives.spacingXs,
        paddingVertical: primitives.spacingXxs,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
      text: {
        color: semantics.badgeTextInverse,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
