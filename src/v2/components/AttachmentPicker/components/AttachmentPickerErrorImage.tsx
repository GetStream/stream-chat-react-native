import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Picture } from '../../../icons';

export const AttachmentPickerErrorImage: React.FC = () => {
  const {
    theme: {
      colors: { grey_gainsboro },
    },
  } = useTheme();

  return <Picture height={140} pathFill={grey_gainsboro} width={140} />;
};
