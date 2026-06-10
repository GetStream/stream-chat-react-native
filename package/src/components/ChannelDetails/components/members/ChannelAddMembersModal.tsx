import React, { useCallback, useState } from 'react';

import { ActivityIndicator } from 'react-native';

import {
  ChannelAddMembersProvider,
  useChannelAddMembersContext,
} from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../../../hooks/useStableCallback';
import { Checkmark } from '../../../../icons/checkmark-1';
import { useIsSelectionEmpty } from '../../../../state-store/selection-store';
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

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembersModalContent = ({ onClose }: ChannelAddMembersModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `channel-add-members:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <ChannelAddMembersProvider>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <ChannelAddMembersModalBody onClose={onClose} />
      </NotificationTargetProvider>
    </ChannelAddMembersProvider>
  );
};

const ChannelAddMembersModalBody = ({ onClose }: ChannelAddMembersModalContentProps) => {
  const { channel } = useChannelDetailsContext();
  const { addMembers } = useChannelActions(channel);
  const { ChannelAddMembers } = useComponentsContext();
  const { selectionStore } = useChannelAddMembersContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
        memberSection: { confirmButton: confirmButtonOverride },
      },
    },
  } = useTheme();
  const isSelectionEmpty = useIsSelectionEmpty(selectionStore);
  const [addingMembers, setAddingMembers] = useState(false);
  const confirmEnabled = !isSelectionEmpty && !addingMembers;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleConfirm = useStableCallback(async () => {
    setAddingMembers(true);
    try {
      const ids = Array.from(selectionStore.state.getLatestValue().selectedIds);
      await addMembers(ids, {
        onSuccess: () => {
          onClose();
        },
      });
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
      <ChannelAddMembers />
      <NotificationList />
    </>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembersModal = ({ onClose, visible }: ChannelAddMembersModalProps) => (
  <ChannelDetailsModal onClose={onClose} visible={visible}>
    <ChannelAddMembersModalContent onClose={onClose} />
  </ChannelDetailsModal>
);
