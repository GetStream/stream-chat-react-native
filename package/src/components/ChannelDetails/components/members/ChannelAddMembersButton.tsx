import React, { useCallback, useState } from 'react';

import { ChannelAddMembersModal } from './ChannelAddMembersModal';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useCanAddMembers } from '../../../../hooks/useCanAddMembers';
import { UserAdd } from '../../../../icons/user-add';
import { Button, ButtonProps } from '../../../ui/Button/Button';

export type ChannelAddMembersButtonProps = {
  /** Override the default behavior, which opens the Add-members modal. */
  onPress?: () => void;
  /** Style forwarded to the underlying Button. */
  style?: ButtonProps['style'];
  testID?: string;
  variant?: 'icon' | 'text';
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembersButton = ({
  onPress,
  style,
  testID,
  variant = 'text',
}: ChannelAddMembersButtonProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const isVisible = useCanAddMembers(channel);
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
        <ChannelAddMembersModal onClose={handleClose} visible={isAddMembersVisible} />
      ) : null}
    </>
  );
};
