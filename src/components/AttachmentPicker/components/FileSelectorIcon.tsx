import React from 'react';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Folder } from '../../../icons';

type Props = {
  numberOfImageUploads: number;
};

export const FileSelectorIcon: React.FC<Props> = ({ numberOfImageUploads }) => {
  const {
    theme: {
      colors: { grey, grey_gainsboro },
    },
  } = useTheme();

  return (
    <Folder pathFill={numberOfImageUploads === 0 ? grey : grey_gainsboro} />
  );
};
