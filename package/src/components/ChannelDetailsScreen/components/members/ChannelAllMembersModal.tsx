import React from 'react';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useOwnCapabilitiesContext } from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { UserAdd } from '../../../../icons/user-add';
import { Button } from '../../../ui/Button/Button';
import { useChannelDetailsMembersPreview } from '../../hooks/useChannelDetailsMembersPreview';
import { ChannelDetailsModal } from '../modal/Modal';
import { ModalHeader } from '../modal/ModalHeader';

export type ChannelAllMembersModalProps = {
  onAddMembersPress: () => void;
  onClose: () => void;
  visible: boolean;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAllMembersModal = ({
  onAddMembersPress,
  onClose,
  visible,
}: ChannelAllMembersModalProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelMemberList } = useComponentsContext();
  const { t } = useTranslationContext();
  const { updateChannelMembers } = useOwnCapabilitiesContext();
  const { total } = useChannelDetailsMembersPreview(channel);

  return (
    <ChannelDetailsModal onClose={onClose} visible={visible}>
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
    </ChannelDetailsModal>
  );
};
