import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Picture } from '../../../icons';

export const AttachmentPickerErrorImage = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Picture height={22} stroke={semantics.textTertiary} width={22} />;
};
