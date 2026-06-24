import React, { useState } from 'react';

import { ActivityIndicator, Keyboard } from 'react-native';

import { ModalHeader } from './modal/ModalHeader';

import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { useAreChannelDetailsEdited } from '../../../state-store/edit-channel-details-store';
import { Button } from '../../ui/Button/Button';

const loadingIconStyle = { margin: 0 };
const LoadingButtonIcon = ({ height, width }: { height?: number; width?: number }) => (
  <ActivityIndicator style={{ ...loadingIconStyle, ...{ height, width } }} />
);

export type ChannelEditDetailsFormHeaderProps = {
  /** Called when the form is dismissed via the close button or after a successful save. */
  onClose: () => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditDetailsFormHeader = ({ onClose }: ChannelEditDetailsFormHeaderProps) => {
  const { store, submit } = useChannelEditDetailsContext();
  const { t } = useTranslationContext();
  const [saving, setSaving] = useState(false);
  const channelDetailsEdited = useAreChannelDetailsEdited(store);
  const confirmEnabled = channelDetailsEdited && !saving;

  const handleConfirm = useStableCallback(async () => {
    if (!confirmEnabled) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await submit();
      onClose();
    } catch {
      // failure notification already surfaced by the channel action
    } finally {
      setSaving(false);
    }
  });

  return (
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
  );
};
