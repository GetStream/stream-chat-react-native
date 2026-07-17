import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export const GiphyBadge = () => {
  const { icons } = useComponentsContext();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <icons.Giphy height={12} width={12} />
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
        color: semantics.badgeTextOnAccent,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
