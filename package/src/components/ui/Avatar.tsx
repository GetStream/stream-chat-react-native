import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type NewAvatarProps = {
  size: 'xs' | 'sm' | 'md' | 'lg';
  imageUrl?: string;
  placeholder?: React.ReactNode;
  showBorder?: boolean;
};

const sizes = {
  lg: {
    height: 40,
    width: 40,
  },
  md: {
    height: 32,
    width: 32,
  },
  sm: {
    height: 24,
    width: 24,
  },
  xs: {
    height: 20,
    width: 20,
  },
};

export const NewAvatar = (props: NewAvatarProps) => {
  const { size, imageUrl, placeholder, showBorder } = props;
  const styles = useStyles();

  return (
    <View
      style={[
        styles.container,
        sizes[size],
        { backgroundColor: imageUrl ? undefined : '#D2E3FF' },
        showBorder ? styles.border : undefined,
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, sizes[size]]} />
      ) : (
        placeholder
      )}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { colors, radius },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        border: {
          borderColor: colors.border.image,
          borderWidth: 2,
        },
        container: {
          alignItems: 'center',
          borderRadius: radius.full,
          justifyContent: 'center',
          overflow: 'hidden',
        },
        image: {},
      }),
    [colors, radius],
  );
};
