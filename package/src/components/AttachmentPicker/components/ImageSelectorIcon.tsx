import React from 'react';

import { AttachmentPickerIconProps } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Picture } from '../../../icons';

export const ImageSelectorIcon = ({ selectedPicker }: AttachmentPickerIconProps) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return <Picture pathFill={selectedPicker === 'images' ? accent_blue : grey} />;
};
