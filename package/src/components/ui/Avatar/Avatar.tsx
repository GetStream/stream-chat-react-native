import React, { useCallback, useMemo, useState } from 'react';
import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { avatarSizes } from './constants';

import { useChatContext } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type AvatarProps = {
  size: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  imageUrl?: string;
  placeholder?: React.ReactNode;
  showBorder?: boolean;
  backgroundColor?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export const Avatar = (props: AvatarProps) => {
  const [error, setError] = useState(false);
  const {
    theme: { semantics },
  } = useTheme();
  const { ImageComponent } = useChatContext();
  const defaultAvatarBg = semantics.avatarPaletteBg1;
  const {
    backgroundColor = defaultAvatarBg,
    size,
    imageUrl,
    placeholder,
    showBorder,
    style,
  } = props;
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
        style,
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
  const { borderCoreOpacitySubtle } = semantics;
  return useMemo(
    () =>
      StyleSheet.create({
        border: {
          borderColor: borderCoreOpacitySubtle,
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
    [borderCoreOpacitySubtle],
  );
};
