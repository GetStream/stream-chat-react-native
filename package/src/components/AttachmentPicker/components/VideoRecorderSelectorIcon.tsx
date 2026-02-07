import React from 'react';

import { AttachmentPickerIconProps } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../icons';

export const VideoRecorderSelectorIcon = ({ selectedPicker }: AttachmentPickerIconProps) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return (
    <Recorder
      height={20}
      pathFill={selectedPicker === 'camera-video' ? accent_blue : grey}
      width={20}
    />
  );
};
