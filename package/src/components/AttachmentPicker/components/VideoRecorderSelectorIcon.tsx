import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../icons';

export const VideoRecorderSelectorIcon = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return <Recorder height={20} pathFill={grey} width={20} />;
};
