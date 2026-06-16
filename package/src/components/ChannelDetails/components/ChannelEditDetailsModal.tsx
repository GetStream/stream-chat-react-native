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
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import {
  isImageDirty,
  isNameDirty,
  useIsImageDirty,
  useIsNameDirty,
} from '../../../state-store/edit-channel-details-store';
import type { File } from '../../../types/types';
import { NotificationList } from '../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../Notifications/NotificationTargetContext';
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
  const { channel, doFileUploadRequest } = useChannelDetailsContext();
  const { store } = useChannelEditDetailsContext();
  const { updateImage, updateName } = useChannelActions(channel);
  const { ChannelEditDetails } = useComponentsContext();
  const { t } = useTranslationContext();
  const [saving, setSaving] = useState(false);
  const nameDirty = useIsNameDirty(store);
  const imageDirty = useIsImageDirty(store);
  const confirmEnabled = (nameDirty || imageDirty) && !saving;

  const handleConfirm = useStableCallback(async () => {
    if (!confirmEnabled) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      const state = store.state.getLatestValue();
      const { currentName, updatedImage } = state;
      const nameDirty = isNameDirty(state);
      const imageDirty = isImageDirty(state);
      let nameOk = true;
      let imageOk = true;
      const tasks: Promise<void>[] = [];
      if (nameDirty) {
        nameOk = false;
        tasks.push(
          updateName(currentName, {
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
            updatedImage as File | null,
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
  const notificationHostId = channel?.cid ? `channel-edit-details:${channel.cid}` : undefined;

  if (!notificationHostId || !channel) {
    return null;
  }

  return (
    <ChannelEditDetailsProvider channel={channel}>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <ChannelEditDetailsModalBody onClose={onClose} />
      </NotificationTargetProvider>
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
