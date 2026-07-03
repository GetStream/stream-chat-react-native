import React, { useCallback, useState } from 'react';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useCanAddMembersToChannel } from '../../../../hooks/useCanAddMembersToChannel';
import { UserAdd } from '../../../../icons/user-add';
import { Button, ButtonProps } from '../../../ui/Button/Button';
import { ChannelDetailsModal } from '../modal/Modal';

export type ChannelAddMembersButtonProps = {
  /** Override the default behavior, which opens the Add-members modal. */
  onPress?: () => void;
  /** Style forwarded to the underlying Button. */
  style?: ButtonProps['style'];
  testID?: string;
  variant?: 'icon' | 'text';
};

export const ChannelAddMembersButton = ({
  onPress,
  style,
  testID,
  variant = 'text',
}: ChannelAddMembersButtonProps) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelAddMembersForm } = useComponentsContext();
  const { t } = useTranslationContext();
  const isVisible = useCanAddMembersToChannel(channel);
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);

  // The built-in modal is only used by the default press behavior. When a custom handler
  // (onPress prop) is provided, the consumer owns the modal, so we must not render the built-in one.
  const usesDefaultModal = !onPress;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    setAddMembersVisible(true);
  }, [onPress]);

  const handleClose = useCallback(() => setAddMembersVisible(false), []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {variant === 'icon' ? (
        <Button
          accessibilityLabelKey='a11y/Add members'
          iconOnly
          LeadingIcon={UserAdd}
          onPress={handlePress}
          size='md'
          style={style}
          testID={testID}
          type='outline'
          variant='secondary'
        />
      ) : (
        <Button
          accessibilityLabelKey='a11y/Add members'
          label={t('Add')}
          onPress={handlePress}
          size='sm'
          style={style}
          testID={testID}
          type='outline'
          variant='secondary'
        />
      )}
      {usesDefaultModal ? (
        <ChannelDetailsModal onClose={handleClose} visible={isAddMembersVisible}>
          <ChannelAddMembersForm onClose={handleClose} />
        </ChannelDetailsModal>
      ) : null}
    </>
  );
};
