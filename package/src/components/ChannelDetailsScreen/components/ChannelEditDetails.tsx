import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { primitives } from '../../../theme';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

export type ChannelEditDetailsProps = {
  /**
   * Fires whenever the channel name input changes. Parent components use this to
   * track the current value so they can enable/disable a save action and read
   * the value when committing the update.
   */
  onNameChange: (name: string) => void;
};

const noop = () => {};

export const ChannelEditDetails = ({ onNameChange }: ChannelEditDetailsProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        editChannel: {
          avatarSection: avatarSectionOverride,
          container: containerOverride,
          nameInput: nameInputOverride,
          uploadButton: uploadButtonOverride,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const initialName = (channel.data?.name as string | undefined) ?? '';
  const [name, setName] = useState(initialName);

  const stableOnNameChange = useStableCallback(onNameChange);
  const lastNameRef = useRef(name);
  useEffect(() => {
    if (lastNameRef.current === name) return;
    lastNameRef.current = name;
    stableOnNameChange(name);
  }, [name, stableOnNameChange]);

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={[styles.avatarSection, avatarSectionOverride]}>
        <ChannelAvatar channel={channel} showBorder={false} size='2xl' />
        <Button
          accessibilityLabelKey='a11y/Upload channel image'
          label={t('Upload')}
          onPress={noop}
          size='sm'
          style={[styles.uploadButton, uploadButtonOverride]}
          testID='channel-edit-upload-button'
          type='ghost'
          variant='primary'
        />
      </View>
      <Input
        accessibilityLabel={t('a11y/Channel name')}
        autoCapitalize='words'
        autoCorrect={false}
        containerStyle={nameInputOverride}
        helperText={false}
        onChangeText={setName}
        placeholder={t('Channel name')}
        returnKeyType='done'
        testID='channel-edit-name-input'
        value={name}
        variant='outline'
      />
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        avatarSection: {
          alignItems: 'center',
          gap: primitives.spacingXs,
        },
        container: {
          flex: 1,
          gap: primitives.spacingXl,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingMd,
        },
        uploadButton: {
          width: 'auto',
        },
      }),
    [],
  );
