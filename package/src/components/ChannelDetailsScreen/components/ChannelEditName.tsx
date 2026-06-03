import React, { useCallback, useState } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelName } from '../../../hooks/useChannelName';
import { Input } from '../../ui/Input/Input';

export type ChannelEditNameProps = {
  /**
   * Fires whenever the channel name input changes. Parent components use this to
   * track the current value so they can enable/disable a save action and read
   * the value when committing the update.
   */
  onNameChange: (name: string) => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditName = ({ onNameChange }: ChannelEditNameProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        editChannel: { nameInput: nameInputOverride },
      },
    },
  } = useTheme();

  const initialName = useChannelName(channel) ?? '';
  const [name, setName] = useState(initialName);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      onNameChange(newName);
    },
    [onNameChange],
  );

  return (
    <Input
      accessibilityLabel={t('a11y/Channel name')}
      autoCapitalize='words'
      autoCorrect={false}
      containerStyle={nameInputOverride}
      helperText={false}
      onChangeText={handleNameChange}
      placeholder={t('Channel name')}
      returnKeyType='done'
      testID='channel-edit-name-input'
      value={name}
      variant='outline'
    />
  );
};
