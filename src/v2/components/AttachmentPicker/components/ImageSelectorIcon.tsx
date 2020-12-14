import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Picture } from '../../../icons';

type Props = {
  selectedPicker?: 'images';
};

export const ImageSelectorIcon: React.FC<Props> = ({ selectedPicker }) => {
  const {
    theme: {
      colors: { primary },
    },
  } = useTheme();

  return (
    <Picture pathFill={selectedPicker === 'images' ? primary : '#7A7A7A'} />
  );
};
