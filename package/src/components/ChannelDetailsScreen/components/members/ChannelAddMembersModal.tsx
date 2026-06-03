import React, { useCallback, useState } from 'react';

import { ActivityIndicator } from 'react-native';

import type { UserResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../../../hooks/useStableCallback';
import { Checkmark } from '../../../../icons/checkmark-1';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { Button } from '../../../ui/Button/Button';
import { ChannelDetailsModal } from '../modal/Modal';
import { ModalHeader } from '../modal/ModalHeader';

const loadingIconStyle = { margin: 0 };
const LoadingButtonIcon = ({ height, width }: { height?: number; width?: number }) => (
  <ActivityIndicator style={{ ...loadingIconStyle, ...{ height, width } }} />
);

export type ChannelAddMembersModalProps = {
  onClose: () => void;
  visible: boolean;
};

type ChannelAddMembersModalContentProps = {
  onClose: () => void;
};

const ChannelAddMembersModalContent = ({ onClose }: ChannelAddMembersModalContentProps) => {
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

  const handleClose = useCallback(() => {
    setAddMembersSelection([]);
    onClose();
  }, [onClose]);

  const handleSelectionChange = useCallback((users: UserResponse[]) => {
    setAddMembersSelection(users);
  }, []);

  const handleConfirm = useStableCallback(async () => {
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
    <>
      <ModalHeader
        onClose={handleClose}
        rightAction={
          <Button
            accessibilityLabel={t('a11y/Confirm add members')}
            accessibilityRole='button'
            accessibilityState={{ busy: addingMembers, disabled: !confirmEnabled }}
            disabled={!confirmEnabled}
            variant='primary'
            onPress={handleConfirm}
            type='solid'
            LeadingIcon={addingMembers ? LoadingButtonIcon : Checkmark}
            iconOnly
            testID='channel-details-add-members-confirm-button'
            style={confirmButtonOverride}
          />
        }
        title={t('Add Members')}
      />
      <ChannelAddMembers onSelectionChange={handleSelectionChange} />
      <NotificationList />
    </>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembersModal = ({ onClose, visible }: ChannelAddMembersModalProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `channel-add-members:${channel.cid}` : undefined;

  return (
    <ChannelDetailsModal onClose={onClose} visible={visible}>
      {notificationHostId ? (
        <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
          <ChannelAddMembersModalContent onClose={onClose} />
        </NotificationTargetProvider>
      ) : null}
    </ChannelDetailsModal>
  );
};
