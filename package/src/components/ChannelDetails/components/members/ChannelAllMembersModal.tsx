import React from 'react';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../../hooks';
import { useChannelOwnCapabilities } from '../../../../hooks/useChannelOwnCapabilities';
import { UserAdd } from '../../../../icons/user-add';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { Button } from '../../../ui/Button/Button';
import { ChannelDetailsModal } from '../modal/Modal';
import { ModalHeader } from '../modal/ModalHeader';

export type ChannelAllMembersModalProps = {
  onAddMembersPress: () => void;
  onClose: () => void;
  visible: boolean;
};

type ChannelAllMembersModalContentProps = Omit<ChannelAllMembersModalProps, 'visible'>;

const ChannelAllMembersModalBody = ({
  onAddMembersPress,
  onClose,
}: ChannelAllMembersModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelMemberList } = useComponentsContext();
  const { t } = useTranslationContext();
  const ownCapabilities = useChannelOwnCapabilities(channel);
  const updateChannelMembers = ownCapabilities?.includes('update-channel-members') ?? false;
  const total = useChannelMemberCount(channel);

  return (
    <>
      <ModalHeader
        onClose={onClose}
        rightAction={
          updateChannelMembers ? (
            <Button
              accessibilityLabelKey='a11y/Add members'
              iconOnly
              LeadingIcon={UserAdd}
              onPress={onAddMembersPress}
              size='md'
              testID='channel-details-member-list-add-button'
              type='outline'
              variant='secondary'
            />
          ) : null
        }
        title={t('{{count}} members', { count: total })}
      />
      <ChannelMemberList />
      <NotificationList />
    </>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAllMembersModalContent = ({
  onAddMembersPress,
  onClose,
}: ChannelAllMembersModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `channel-member-list:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
      <ChannelAllMembersModalBody onAddMembersPress={onAddMembersPress} onClose={onClose} />
    </NotificationTargetProvider>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAllMembersModal = ({
  onAddMembersPress,
  onClose,
  visible,
}: ChannelAllMembersModalProps) => (
  <ChannelDetailsModal onClose={onClose} visible={visible}>
    <ChannelAllMembersModalContent onAddMembersPress={onAddMembersPress} onClose={onClose} />
  </ChannelDetailsModal>
);
