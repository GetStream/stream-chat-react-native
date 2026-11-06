import React, { useCallback, useMemo, useState } from 'react';
import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { avatarSizes } from './constants';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type AvatarProps = {
  size: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  /** Overrides the generated accessibility label, which is built from `name` when it is set. */
  accessibilityLabel?: string;
  backgroundColor?: ColorValue;
  imageUrl?: string;
  /** Display name of the user or channel for the label. Without it the avatar is unlabeled. */
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
  const accessibilityLabelParams = useMemo(() => ({ name: name ?? '' }), [name]);
  const composedLabel = useA11yLabel('avatar.accessibilityLabel', accessibilityLabelParams);
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
    theme: { avatar, semantics },
  } = useTheme();
  const { borderCoreOpacitySubtle } = semantics;
  return useMemo(
    () =>
      StyleSheet.create({
        border: {
          borderColor: borderCoreOpacitySubtle,
          borderWidth: 1,
          ...avatar.border,
        },
        container: {
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          justifyContent: 'center',
          overflow: 'hidden',
          ...avatar.container,
        },
        image: {
          ...avatar.image,
        },
      }),
    [avatar.border, avatar.container, avatar.image, borderCoreOpacitySubtle],
  );
};
