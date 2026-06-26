import React, { useCallback } from 'react';

import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import type { EditChannelDetailsState } from '../../../state-store/edit-channel-details-store';
import { Input } from '../../ui/Input/Input';

const selectCurrentName = (state: EditChannelDetailsState) => ({
  currentName: state.currentName,
});

export const ChannelEditName = () => {
  const { store } = useChannelEditDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
        editChannel: { nameInput: nameInputOverride },
      },
    },
  } = useTheme();

  const { currentName } = useStateStore(store.state, selectCurrentName);

  const handleNameChange = useCallback(
    (newName: string) => {
      store.setCurrentName(newName);
    },
    [store],
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
      value={currentName}
      variant='outline'
    />
  );
};
