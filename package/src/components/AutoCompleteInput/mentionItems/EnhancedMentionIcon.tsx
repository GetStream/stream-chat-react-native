import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { IconProps } from '../../../icons/utils/base';

export type EnhancedMentionIconProps = {
  /**
   * Any icon component from `package/src/icons` (or a custom one matching the
   * same `IconProps` shape). The wrapper standardizes size + color and is the
   * single place future visual treatments (e.g. an icon backdrop) will be
   * added — per-type mention items don't have to know about any of that.
   */
  Icon: React.ComponentType<IconProps>;
  /**
   * Icon size in px. Defaults to 24.
   */
  size?: IconProps['size'];
  /**
   * Stroke / fill color. Defaults to `semantics.textSecondary`.
   */
  color?: IconProps['pathFill'];
};

/**
 * Universal wrapper for non-user mention-row icons. Renders the supplied
 * `Icon` component with consistent size + color. Per-type mention items
 * (`MentionBroadcastItem`, `MentionRoleItem`, `MentionUserGroupItem`) pass
 * their specific icon component in — integrators wanting to swap a single
 * type's icon can wrap their own one-liner around this same primitive.
 */
export const EnhancedMentionIcon = ({ color, Icon, size = 16 }: EnhancedMentionIconProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  return <Icon pathFill={color ?? semantics.textSecondary} size={size} />;
};
