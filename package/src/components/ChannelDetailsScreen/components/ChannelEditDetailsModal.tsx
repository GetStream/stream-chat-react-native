import React, { useState } from 'react';

import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { NotificationList } from '../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../Notifications/NotificationTargetContext';
import { Button } from '../../ui/Button/Button';
import { Spinner } from '../../UIComponents/Spinner';

const loadingIconStyle = { margin: 0 };
const LoadingButtonIcon = ({ height, width }: { height?: number; width?: number }) => (
  <Spinner height={height} style={loadingIconStyle} width={width} />
);

export type ChannelEditDetailsModalProps = {
  onClose: () => void;
  visible: boolean;
};

type ChannelEditDetailsModalContentProps = {
  onClose: () => void;
};

const ChannelEditDetailsModalContent = ({ onClose }: ChannelEditDetailsModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const { updateName } = useChannelActions(channel);
  const { ChannelEditDetails } = useComponentsContext();
  const { t } = useTranslationContext();
  const initialName = (channel.data?.name as string | undefined) ?? '';
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const trimmedName = name.trim();
  const confirmEnabled = trimmedName.length > 0 && trimmedName !== initialName && !saving;

  const handleNameChange = useStableCallback((newName: string) => setName(newName));

  const handleClose = useStableCallback(() => {
    setName(initialName);
    onClose();
  });

  const handleConfirm = useStableCallback(async () => {
    if (!confirmEnabled) return;
    setSaving(true);
    try {
      await updateName(trimmedName, {
        onSuccess: () => {
          onClose();
        },
      });
    } finally {
      setSaving(false);
    }
  });

  return (
    <>
      <ModalHeader
        onClose={handleClose}
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
      <ChannelEditDetails onNameChange={handleNameChange} />
      <NotificationList />
    </>
  );
};

export const ChannelEditDetailsModal = ({ onClose, visible }: ChannelEditDetailsModalProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `channel-edit-details:${channel.cid}` : undefined;

  return (
    <ChannelDetailsModal onClose={onClose} visible={visible}>
      {notificationHostId ? (
        <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
          <ChannelEditDetailsModalContent onClose={onClose} />
        </NotificationTargetProvider>
      ) : null}
    </ChannelDetailsModal>
  );
};
