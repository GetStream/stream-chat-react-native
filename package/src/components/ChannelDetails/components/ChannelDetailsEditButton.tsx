import React, { useCallback, useState } from 'react';

import { ChannelEditDetailsModal } from './ChannelEditDetailsModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Button, ButtonProps } from '../../ui/Button/Button';
import { useIsEditButtonVisible } from '../hooks/useIsEditButtonVisible';

export type ChannelDetailsEditButtonProps = {
  /** Style forwarded to the underlying Button. */
  style?: ButtonProps['style'];
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsEditButton = ({ style }: ChannelDetailsEditButtonProps = {}) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const isVisible = useIsEditButtonVisible(channel);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleEditPress = useCallback(() => setEditModalVisible(true), []);

  const handleEditModalClose = useCallback(() => setEditModalVisible(false), []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Button
        accessibilityLabelKey='a11y/Edit channel'
        label={t('Edit')}
        onPress={handleEditPress}
        size='sm'
        style={style}
        testID='channel-details-edit-button'
        type='outline'
        variant='secondary'
      />
      <ChannelEditDetailsModal onClose={handleEditModalClose} visible={editModalVisible} />
    </>
  );
};
