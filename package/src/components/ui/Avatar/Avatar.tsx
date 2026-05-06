import React, { useCallback, useMemo, useState } from 'react';
import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { avatarSizes } from './constants';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type AvatarProps = {
  size: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  /**
   * Override for the auto-generated accessibility label. When omitted and a
   * `name` is provided, the SDK uses `a11y/Avatar of {{name}}`.
   */
  accessibilityLabel?: string;
  backgroundColor?: ColorValue;
  imageUrl?: string;
  /**
   * Display name of the entity this avatar represents (user, channel). Used to
   * compose the default `accessibilityLabel`. Optional — when neither this nor
   * `accessibilityLabel` is provided, the avatar is left unlabeled.
   */
  name?: string;
  placeholder?: React.ReactNode;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Avatar = (props: AvatarProps) => {
  const [error, setError] = useState(false);
  const {
    theme: { semantics },
  } = useTheme();
  const { ImageComponent } = useComponentsContext();
  const defaultAvatarBg = semantics.avatarPaletteBg1;
  const {
    accessibilityLabel: accessibilityLabelOverride,
    backgroundColor = defaultAvatarBg,
    imageUrl,
    name,
    placeholder,
    showBorder,
    size,
    style,
  } = props;
  const styles = useStyles();
  const composedLabel = useA11yLabel('a11y/Avatar of {{name}}', { name: name ?? '' });
  const accessibilityLabel = accessibilityLabelOverride ?? (name ? composedLabel : undefined);

  const onHandleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessible={accessibilityLabel ? true : undefined}
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
          accessibilityElementsHidden
          importantForAccessibility='no'
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
