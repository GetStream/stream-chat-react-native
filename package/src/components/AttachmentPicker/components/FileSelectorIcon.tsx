import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Folder } from '../../../icons';

export const FileSelectorIcon = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return <Folder pathFill={grey} />;
};
