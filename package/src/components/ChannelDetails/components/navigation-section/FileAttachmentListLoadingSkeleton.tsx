import React from 'react';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { GenericListLoadingSkeleton } from '../../../UIComponents/GenericListLoadingSkeleton';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const FileAttachmentListLoadingSkeleton = () => {
  const {
    theme: { fileAttachmentListSkeleton },
  } = useTheme();

  return (
    <GenericListLoadingSkeleton
      skeleton={fileAttachmentListSkeleton}
      testID='file-attachment-list-loading-skeleton'
    />
  );
};

FileAttachmentListLoadingSkeleton.displayName =
  'FileAttachmentListLoadingSkeleton{fileAttachmentListSkeleton}';
