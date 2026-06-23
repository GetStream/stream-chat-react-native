import React, { useCallback, useState } from 'react';

import { ChannelEditDetailsModal } from './ChannelEditDetailsModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Button, ButtonProps } from '../../ui/Button/Button';
import { useCanEdit } from '../hooks/useCanEdit';

export type ChannelDetailsEditButtonProps = {
  /** Override the default behavior, which opens the Edit modal. */
  onPress?: () => void;
  /** Style forwarded to the underlying Button. */
  style?: ButtonProps['style'];
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsEditButton = ({
  onPress,
  style,
}: ChannelDetailsEditButtonProps = {}) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const isVisible = useCanEdit(channel);
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
        size='sm'
        style={style}
        testID='channel-details-edit-button'
        type='outline'
        variant='secondary'
      />
      {usesDefaultModal ? (
        <ChannelEditDetailsModal onClose={handleEditModalClose} visible={editModalVisible} />
      ) : null}
    </>
  );
};
