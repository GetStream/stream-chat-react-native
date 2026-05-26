import React, { useState } from 'react';

import type { UserResponse } from 'stream-chat';

import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { NotificationList } from '../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../Notifications/NotificationTargetContext';
import { Button } from '../../ui/Button/Button';

export type ChannelAddMembersModalProps = {
  onClose: () => void;
  visible: boolean;
};

export const ChannelAddMembersModal = ({ onClose, visible }: ChannelAddMembersModalProps) => {
  const { channel } = useChannelDetailsContext();
  const { addMembers } = useChannelActions(channel);
  const { ChannelAddMembers } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        memberSection: { confirmButton: confirmButtonOverride },
      },
    },
  } = useTheme();
  const [addMembersSelection, setAddMembersSelection] = useState<UserResponse[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const confirmEnabled = addMembersSelection.length > 0 && !addingMembers;
  const notificationHostId = channel?.cid ? `channel-add-members:${channel.cid}` : undefined;

  const handleClose = useStableCallback(() => {
    setAddMembersSelection([]);
    onClose();
  });

  const handleSelectionChange = useStableCallback((users: UserResponse[]) => {
    setAddMembersSelection(users);
  });

  const handleConfirm = useStableCallback(async () => {
    if (!addMembersSelection.length || addingMembers) return;
    setAddingMembers(true);
    try {
      await addMembers(
        addMembersSelection.map((u) => u.id),
        {
          onSuccess: () => {
            setAddMembersSelection([]);
            onClose();
          },
        },
      );
    } finally {
      setAddingMembers(false);
    }
  });

  return (
    <ChannelDetailsModal onClose={onClose} visible={visible}>
      {notificationHostId ? (
        <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
          <ModalHeader
            onClose={handleClose}
            rightAction={
              <Button
                accessibilityLabel={t('a11y/Confirm add members')}
                accessibilityRole='button'
                accessibilityState={{ disabled: !confirmEnabled }}
                disabled={!confirmEnabled}
                variant='primary'
                onPress={handleConfirm}
                type='solid'
                LeadingIcon={Checkmark}
                iconOnly
                testID='channel-details-add-members-confirm-button'
                style={confirmButtonOverride}
              />
            }
            title={t('Add Members')}
          />
          <ChannelAddMembers onSelectionChange={handleSelectionChange} />
          <NotificationList />
        </NotificationTargetProvider>
      ) : null}
    </ChannelDetailsModal>
  );
};
