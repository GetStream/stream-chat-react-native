import React, { useCallback, useState } from 'react';

import { ChannelEditDetailsModal } from './ChannelEditDetailsModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { Button } from '../../ui/Button/Button';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsEditButton = () => {
  const { channel, onEditChannelPress } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const ownCapabilities = useChannelOwnCapabilities(channel);
  const canUpdateChannel = ownCapabilities?.includes('update-channel') ?? false;
  const isDirect = useIsDirectChat(channel);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleEditPress = useCallback(() => {
    if (onEditChannelPress) {
      onEditChannelPress();
      return;
    }
    setEditModalVisible(true);
  }, [onEditChannelPress]);

  const handleEditModalClose = useCallback(() => setEditModalVisible(false), []);

  if (!canUpdateChannel || isDirect) {
    return null;
  }

  return (
    <>
      <Button
        accessibilityLabelKey='a11y/Edit channel'
        label={t('Edit')}
        onPress={handleEditPress}
        size='sm'
        testID='channel-details-edit-button'
        type='outline'
        variant='secondary'
      />
      <ChannelEditDetailsModal onClose={handleEditModalClose} visible={editModalVisible} />
    </>
  );
};
