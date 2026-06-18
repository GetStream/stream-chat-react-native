import React from 'react';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../../hooks';
import { ChannelDetailsModal } from '../modal/Modal';
import { ModalHeader } from '../modal/ModalHeader';

export type ChannelAllMembersModalProps = {
  onClose: () => void;
  visible: boolean;
};

type ChannelAllMembersModalContentProps = Omit<ChannelAllMembersModalProps, 'visible'>;

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAllMembersModalContent = ({ onClose }: ChannelAllMembersModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelAddMembersButton, ChannelMemberList } = useComponentsContext();
  const { t } = useTranslationContext();
  const total = useChannelMemberCount(channel);

  return (
    <>
      <ModalHeader
        onClose={onClose}
        rightAction={
          <ChannelAddMembersButton testID='channel-details-member-list-add-button' variant='icon' />
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
export const ChannelAllMembersModal = ({ onClose, visible }: ChannelAllMembersModalProps) => (
  <ChannelDetailsModal onClose={onClose} visible={visible}>
    <ChannelAllMembersModalContent onClose={onClose} />
  </ChannelDetailsModal>
);
