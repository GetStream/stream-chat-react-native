import React, { useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

export type AvatarProps = {
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

export const Avatar = (props: AvatarProps) => {
  const [error, setError] = useState(false);
  const { size, imageUrl, placeholder, showBorder } = props;
  const styles = useStyles();

  const onHandleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <View
      style={[
        styles.container,
        sizes[size],
        { backgroundColor: imageUrl && !error ? undefined : '#D2E3FF' },
        showBorder ? styles.border : undefined,
      ]}
      testID='avatar-image'
    >
      {imageUrl && !error ? (
        <Image
          onError={onHandleError}
          source={{ uri: imageUrl }}
          style={[styles.image, sizes[size]]}
        />
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
          borderWidth: 1,
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
