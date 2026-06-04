import React from 'react';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../../hooks';
import { useChannelOwnCapabilities } from '../../../../hooks/useChannelOwnCapabilities';
import { UserAdd } from '../../../../icons/user-add';
import { Button } from '../../../ui/Button/Button';
import { ChannelDetailsModal } from '../modal/Modal';
import { ModalHeader } from '../modal/ModalHeader';

export type ChannelAllMembersModalProps = {
  onAddMembersPress: () => void;
  onClose: () => void;
  visible: boolean;
};

type ChannelAllMembersModalContentProps = Omit<ChannelAllMembersModalProps, 'visible'>;

const ChannelAllMembersModalContent = ({
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
    </>
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
  // The content lives in a child component so its hooks (member-state subscription,
  // member preview sort) only run while the modal is open. React Native's `Modal`
  // renders `null` when `visible` is false, so the child never mounts until then.
  <ChannelDetailsModal onClose={onClose} visible={visible}>
    <ChannelAllMembersModalContent onAddMembersPress={onAddMembersPress} onClose={onClose} />
  </ChannelDetailsModal>
);
