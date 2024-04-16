import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Picture } from '../../../icons';

type Props = {
  selectedPicker?: 'images';
};

export const ImageSelectorIcon = ({ selectedPicker }: Props) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return <Picture pathFill={selectedPicker === 'images' ? accent_blue : grey} />;
};
