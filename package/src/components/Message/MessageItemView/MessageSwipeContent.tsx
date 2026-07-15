import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export const MessageSwipeContent = () => {
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();
  const { icons } = useComponentsContext();

  return (
    <View style={styles.container}>
      <icons.ArrowShareLeft stroke={semantics.buttonSecondaryTextOnAccent} height={20} width={20} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageItemView: {
        swipeLeftContent: { container },
      },
      semantics,
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.buttonSecondaryBg,
        height: 32,
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: primitives.radiusMax,
        ...container,
      },
    });
  }, [container, semantics.buttonSecondaryBg]);
};
