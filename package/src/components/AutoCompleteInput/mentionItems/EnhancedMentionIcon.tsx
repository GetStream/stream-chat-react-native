import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

export type EnhancedMentionIconProps = {
  /** Icon component, rendered at half the chip size inside a circular chip. */
  Icon: React.ComponentType<IconProps>;
  /** Chip diameter in px. Defaults to 32. */
  size?: IconProps['size'];
  /** Icon fill color. Defaults to `semantics.textPrimary`. */
  color?: IconProps['pathFill'];
};

/**
 * Circular chip around the icon of a non-user mention row. Styled through
 * `theme.messageComposer.suggestions.mention.enhancedMentionIcon`.
 */
export const EnhancedMentionIcon = ({ color, Icon, size = 32 }: EnhancedMentionIconProps) => {
  const {
    theme: {
      semantics,
      messageComposer: {
        suggestions: {
          mention: { enhancedMentionIcon },
        },
      },
    },
  } = useTheme();
  const styles = useStyles(size);

  return (
    <View style={[styles.chip, enhancedMentionIcon]}>
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
