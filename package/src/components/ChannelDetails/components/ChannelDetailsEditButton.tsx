import React, { useCallback, useState } from 'react';

import { ChannelDetailsModal } from './modal/Modal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useCanEditChannel } from '../../../hooks/useCanEditChannel';
import { Button, ButtonProps } from '../../ui/Button/Button';

export type ChannelDetailsEditButtonProps = {
  /** Overrides the default behavior, which opens the edit modal. */
  onPress?: () => void;
  /** Style forwarded to the underlying `Button`. */
  style?: ButtonProps['style'];
};

export const ChannelDetailsEditButton = ({
  onPress,
  style,
}: ChannelDetailsEditButtonProps = {}) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelEditDetailsForm } = useComponentsContext();
  const { t } = useTranslationContext();
  const isVisible = useCanEditChannel(channel);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // With a custom `onPress` the consumer owns the navigation or modal, so the built-in modal is
  // not rendered.
  const usesDefaultModal = !onPress;

  const handleEditPress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    setEditModalVisible(true);
  }, [onPress]);

  const handleEditModalClose = useCallback(() => setEditModalVisible(false), []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Button
        accessibilityLabelKey='channelDetails.editChannel.accessibilityLabel'
        label={t('channelDetails.editChannel.label', 'Edit')}
        onPress={handleEditPress}
        size='md'
        style={style}
        testID='channel-details-edit-button'
        type='outline'
        variant='secondary'
      />
      {usesDefaultModal ? (
        <ChannelDetailsModal onClose={handleEditModalClose} visible={editModalVisible}>
          <ChannelEditDetailsForm onClose={handleEditModalClose} />
        </ChannelDetailsModal>
      ) : null}
    </>
  );
};
