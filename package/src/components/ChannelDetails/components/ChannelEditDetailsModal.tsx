import React, { useState } from 'react';

import { ActivityIndicator, Keyboard } from 'react-native';

import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelEditDetailsProvider,
  useChannelEditDetailsContext,
} from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { useIsFormDirty } from '../../../state-store/edit-channel-details-store';
import { NotificationList } from '../../Notifications/NotificationList';
import { Button } from '../../ui/Button/Button';

const loadingIconStyle = { margin: 0 };
const LoadingButtonIcon = ({ height, width }: { height?: number; width?: number }) => (
  <ActivityIndicator style={{ ...loadingIconStyle, ...{ height, width } }} />
);

export type ChannelEditDetailsModalProps = {
  onClose: () => void;
  visible: boolean;
};

type ChannelEditDetailsModalContentProps = {
  onClose: () => void;
};

const ChannelEditDetailsModalBody = ({ onClose }: ChannelEditDetailsModalContentProps) => {
  const { store, submit } = useChannelEditDetailsContext();
  const { ChannelEditDetails } = useComponentsContext();
  const { t } = useTranslationContext();
  const [saving, setSaving] = useState(false);
  const formDirty = useIsFormDirty(store);
  const confirmEnabled = formDirty && !saving;

  const handleConfirm = useStableCallback(async () => {
    if (!confirmEnabled) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await submit();
      onClose();
    } catch {
      // failure notification already surfaced by the channel action
    } finally {
      setSaving(false);
    }
  });

  return (
    <>
      <ModalHeader
        onClose={onClose}
        rightAction={
          <Button
            accessibilityLabel={t('a11y/Confirm edit channel')}
            accessibilityRole='button'
            accessibilityState={{ busy: saving, disabled: !confirmEnabled }}
            disabled={!confirmEnabled}
            iconOnly
            LeadingIcon={saving ? LoadingButtonIcon : Checkmark}
            onPress={handleConfirm}
            testID='channel-details-edit-confirm-button'
            type='solid'
            variant='primary'
          />
        }
        title={t('Edit')}
      />
      <ChannelEditDetails />
      <NotificationList />
    </>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditDetailsModalContent = ({
  onClose,
}: ChannelEditDetailsModalContentProps) => {
  const { channel } = useChannelDetailsContext();

  if (!channel?.cid) {
    return null;
  }

  return (
    <ChannelEditDetailsProvider>
      <ChannelEditDetailsModalBody onClose={onClose} />
    </ChannelEditDetailsProvider>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditDetailsModal = ({ onClose, visible }: ChannelEditDetailsModalProps) => (
  <ChannelDetailsModal onClose={onClose} visible={visible}>
    <ChannelEditDetailsModalContent onClose={onClose} />
  </ChannelDetailsModal>
);
