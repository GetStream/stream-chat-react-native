import React from 'react';

import { AttachmentPickerIconProps } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Camera } from '../../../icons';

export const CameraSelectorIcon = ({ selectedPicker }: AttachmentPickerIconProps) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return <Camera pathFill={selectedPicker === 'camera-photo' ? accent_blue : grey} />;
};
