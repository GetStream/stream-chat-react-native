import React, { useCallback, useMemo, useState } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import { avatarSizes } from './constants';

import { useChatContext } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type AvatarProps = {
  size: 'xs' | 'sm' | 'md' | 'lg';
  imageUrl?: string;
  placeholder?: React.ReactNode;
  showBorder?: boolean;
  backgroundColor?: ColorValue;
};

export const Avatar = (props: AvatarProps) => {
  const [error, setError] = useState(false);
  const {
    theme: { semantics },
  } = useTheme();
  const { ImageComponent } = useChatContext();
  const defaultAvatarBg = semantics.avatarPaletteBg1;
  const { backgroundColor = defaultAvatarBg, size, imageUrl, placeholder, showBorder } = props;
  const styles = useStyles();

  const onHandleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <View
      style={[
        styles.container,
        avatarSizes[size],
        { backgroundColor },
        showBorder ? styles.border : undefined,
      ]}
      testID='avatar-image'
    >
      {imageUrl && !error ? (
        <ImageComponent
          onError={onHandleError}
          source={{ uri: imageUrl }}
          style={[styles.image, avatarSizes[size]]}
        />
      ) : (
        placeholder
      )}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { borderCoreOpacity10 } = semantics;
  return useMemo(
    () =>
      StyleSheet.create({
        border: {
          borderColor: borderCoreOpacity10,
          borderWidth: 1,
        },
        container: {
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          justifyContent: 'center',
          overflow: 'hidden',
        },
        image: {},
      }),
    [borderCoreOpacity10],
  );
};
