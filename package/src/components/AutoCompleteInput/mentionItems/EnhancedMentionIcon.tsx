import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Megaphone } from '../../../icons/megaphone';
import { Shield } from '../../../icons/shield';
import { PeopleIcon } from '../../../icons/users';
import type { IconProps } from '../../../icons/utils/base';

export type EnhancedMentionType = 'channel' | 'here' | 'role' | 'user_group';

export type EnhancedMentionIconProps = {
  mentionType: EnhancedMentionType;
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
 * Universal icon for non-user mention rows. Resolves a per-type icon
 * (megaphone for channel/here, shield for role, people for user_group) so the
 * dispatcher doesn't have to branch on icon imports.
 */
export const EnhancedMentionIcon = ({
  color,
  mentionType,
  size = 24,
}: EnhancedMentionIconProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const resolvedColor = color ?? semantics.textSecondary;

  switch (mentionType) {
    case 'channel':
    case 'here':
      return <Megaphone pathFill={resolvedColor} size={size} />;
    case 'role':
      return <Shield pathFill={resolvedColor} size={size} />;
    case 'user_group':
      return <PeopleIcon pathFill={resolvedColor} size={size} />;
    default:
      return null;
  }
};
