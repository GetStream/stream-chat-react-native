import React from 'react';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { GenericListLoadingSkeleton } from '../../../UIComponents/GenericListLoadingSkeleton';

export const UserListLoadingSkeleton = () => {
  const {
    theme: { userListSkeleton },
  } = useTheme();

  return (
    <GenericListLoadingSkeleton skeleton={userListSkeleton} testID='user-list-loading-skeleton' />
  );
};

UserListLoadingSkeleton.displayName = 'UserListLoadingSkeleton{userListSkeleton}';
