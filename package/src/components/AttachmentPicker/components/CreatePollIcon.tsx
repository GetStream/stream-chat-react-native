import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Poll } from '../../../icons';

export const CreatePollIcon = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return <Poll height={18} pathFill={grey} width={18} />;
};
