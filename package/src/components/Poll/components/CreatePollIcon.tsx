import React from 'react';

import { AttachmentPickerIconProps } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PollThumbnail } from '../../../icons';

export const CreatePollIcon = ({ selectedPicker }: AttachmentPickerIconProps) => {
  const {
    theme: {
      colors: { accent_blue, grey },
    },
  } = useTheme();

  return (
    <PollThumbnail
      height={18}
      pathFill={selectedPicker === 'polls' ? accent_blue : grey}
      viewBox='0 0 18 18'
      width={18}
    />
  );
};
