import React, { useCallback, useState } from 'react';

import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { useChannelName } from '../../../hooks/useChannelName';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import type { File } from '../../../types/types';
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
  const { channel, doFileUploadRequest } = useChannelDetailsContext();
  const { updateImage, updateName } = useChannelActions(channel);
  const { ChannelEditDetails } = useComponentsContext();
  const { t } = useTranslationContext();
  const initialName = useChannelName(channel) ?? '';
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  // Tri-state: `undefined` = untouched, `File` = picked, `null` = reset.
  const [image, setImage] = useState<File | null | undefined>(undefined);
  const trimmedName = name.trim();
  const nameDirty = trimmedName !== initialName;
  const imageDirty = image !== undefined;
  const confirmEnabled = (nameDirty || imageDirty) && !saving;

  const handleNameChange = useCallback((newName: string) => setName(newName), []);
  const handleImagePicked = useCallback((file: File) => setImage(file), []);
  const handleImageReset = useCallback(() => setImage(null), []);

  const handleClose = useCallback(() => {
    setName(initialName);
    setImage(undefined);
    onClose();
  }, [initialName, onClose]);

  const handleConfirm = useStableCallback(async () => {
    if (!confirmEnabled) return;
    setSaving(true);
    try {
      let nameOk = true;
      let imageOk = true;
      const tasks: Promise<void>[] = [];
      if (nameDirty) {
        nameOk = false;
        tasks.push(
          updateName(trimmedName, {
            onSuccess: () => {
              nameOk = true;
            },
          }),
        );
      }
      if (imageDirty) {
        imageOk = false;
        tasks.push(
          updateImage(
            image,
            {
              onSuccess: () => {
                imageOk = true;
              },
            },
            doFileUploadRequest,
          ),
        );
      }
      await Promise.all(tasks);
      if (nameOk && imageOk) onClose();
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
      <ChannelEditDetails
        onImagePicked={handleImagePicked}
        onImageReset={handleImageReset}
        onNameChange={handleNameChange}
      />
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
