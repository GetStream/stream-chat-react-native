import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PollThumbnail } from '../../../icons';

export const CreatePollIcon = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return <PollThumbnail height={18} pathFill={grey} viewBox='0 0 18 18' width={18} />;
};
