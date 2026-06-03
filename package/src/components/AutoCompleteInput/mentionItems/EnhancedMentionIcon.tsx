import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

export type EnhancedMentionIconProps = {
  /**
   * Any icon component from `package/src/icons` (or a custom one matching the
   * same `IconProps` shape). The wrapper standardizes size + color and wraps
   * the icon in a circular chip — per-type mention items don't have to know
   * about any of that.
   */
  Icon: React.ComponentType<IconProps>;
  /**
   * Icon size in px. Defaults to 16. The surrounding chip scales with this.
   */
  size?: IconProps['size'];
  /**
   * Stroke / fill color. Defaults to `semantics.textSecondary`.
   */
  color?: IconProps['pathFill'];
};

/**
 * Universal wrapper for non-user mention-row icons. Renders the supplied
 * `Icon` inside a circular chip — `backgroundCoreSurfaceSubtle` fill,
 * `borderCoreSubtle` 1px border, `radiusMax` to keep it round.
 */
export const EnhancedMentionIcon = ({ color, Icon, size = 32 }: EnhancedMentionIconProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles(size);

  return (
    <View style={styles.chip}>
      <Icon pathFill={color ?? semantics.textPrimary} size={size / 2} />
    </View>
  );
};

const useStyles = (chipSize: number) => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        chip: {
          alignItems: 'center',
          backgroundColor: semantics.backgroundCoreSurfaceSubtle,
          borderColor: semantics.borderCoreSubtle,
          borderRadius: primitives.radiusMax,
          borderWidth: 1,
          height: chipSize,
          justifyContent: 'center',
          width: chipSize,
        },
      }),
    [chipSize, semantics.backgroundCoreSurfaceSubtle, semantics.borderCoreSubtle],
  );
};
