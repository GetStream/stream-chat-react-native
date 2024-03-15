import React from 'react';
import { Button } from 'react-native';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { iOS14RefreshGallerySelection } from '../../../native';

export const AttachmentPickerIOSSelectMorePhotos = () => {
  const { t } = useTranslationContext();
  return <Button onPress={iOS14RefreshGallerySelection} title={t('Select More Photos')} />;
};
