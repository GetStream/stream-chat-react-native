import React from 'react';

import { AttachmentPickerIconProps } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Folder } from '../../../icons';

export const FileSelectorIcon = ({ selectedPicker }: AttachmentPickerIconProps) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return <Folder pathFill={selectedPicker === 'files' ? accent_blue : grey} />;
};
