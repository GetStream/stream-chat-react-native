import React, { useCallback, useState } from 'react';

import { ActivityIndicator } from 'react-native';

import { useChannelAddMembersContext } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../../hooks/useStableCallback';
import { Checkmark } from '../../../../icons/checkmark-1';
import { useIsSelectionEmpty } from '../../../../state-store/selection-store';
import { Button } from '../../../ui/Button/Button';
import { ModalHeader } from '../modal/ModalHeader';

const loadingIconStyle = { margin: 0 };
const LoadingButtonIcon = ({ height, width }: { height?: number; width?: number }) => (
  <ActivityIndicator style={{ ...loadingIconStyle, ...{ height, width } }} />
);

export type ChannelAddMembersFormHeaderProps = {
  /** Called when the form is dismissed via the close button or after members are added. */
  onClose: () => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembersFormHeader = ({ onClose }: ChannelAddMembersFormHeaderProps) => {
  const { selectionStore, submit } = useChannelAddMembersContext();
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
      await submit();
      onClose();
    } catch {
      // failure notification already surfaced by the channel action
    } finally {
      setAddingMembers(false);
    }
  });

  return (
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
  );
};
