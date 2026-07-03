import React, { useCallback, useState } from 'react';

import { ChannelDetailsModal } from './modal/Modal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useCanEditChannel } from '../../../hooks/useCanEditChannel';
import { Button, ButtonProps } from '../../ui/Button/Button';

export type ChannelDetailsEditButtonProps = {
  /** Override the default behavior, which opens the Edit modal. */
  onPress?: () => void;
  /** Style forwarded to the underlying Button. */
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

  // The built-in modal is only used by the default press behavior. When a custom handler
  // (onPress prop) is provided, the consumer owns the navigation/modal, so we must not render
  // the built-in one.
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
        accessibilityLabelKey='a11y/Edit channel'
        label={t('Edit')}
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
