import React from 'react';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { GenericListLoadingSkeleton } from '../../../UIComponents/GenericListLoadingSkeleton';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const MemberListLoadingSkeleton = () => {
  const {
    theme: { memberListSkeleton },
  } = useTheme();

  return (
    <GenericListLoadingSkeleton
      skeleton={memberListSkeleton}
      testID='member-list-loading-skeleton'
    />
  );
};

MemberListLoadingSkeleton.displayName = 'MemberListLoadingSkeleton{memberListSkeleton}';
