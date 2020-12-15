import React from 'react';
import { Folder } from '../../../icons';

type Props = {
  numberOfImageUploads: number;
};

export const FileSelectorIcon: React.FC<Props> = ({ numberOfImageUploads }) => (
  <Folder pathFill={numberOfImageUploads === 0 ? '#7A7A7A' : '#DBDBDB'} />
);
