import React from 'react';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { GenericListLoadingSkeleton } from '../../../UIComponents/GenericListLoadingSkeleton';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const PinnedMessageListLoadingSkeleton = () => {
  const {
    theme: { pinnedMessageListSkeleton },
  } = useTheme();

  return (
    <GenericListLoadingSkeleton
      skeleton={pinnedMessageListSkeleton}
      testID='pinned-message-list-loading-skeleton'
    />
  );
};

PinnedMessageListLoadingSkeleton.displayName =
  'PinnedMessageListLoadingSkeleton{pinnedMessageListSkeleton}';
