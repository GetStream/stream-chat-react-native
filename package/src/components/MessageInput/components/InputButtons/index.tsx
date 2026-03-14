import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { OwnCapabilitiesContextValue } from '../../../../contexts';
import { useActiveCommand } from '../../../../contexts/messageInputContext/hooks/useActiveCommand';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useAttachmentPickerState } from '../../../../hooks/useAttachmentPickerState';

export type InputButtonsProps = Partial<InputButtonsWithContextProps>;

export type InputButtonsWithContextProps = Pick<
  MessageInputContextValue,
  'AttachButton' | 'hasCameraPicker' | 'hasCommands' | 'hasFilePicker' | 'hasImagePicker'
> &
  Pick<OwnCapabilitiesContextValue, 'uploadFile'>;

export const InputButtonsWithContext = (props: InputButtonsWithContextProps) => {
  const {
    AttachButton,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    uploadFile: ownCapabilitiesUploadFile,
  } = props;
  const { selectedPicker } = useAttachmentPickerState();
  const rotation = useSharedValue(0);
  const command = useActiveCommand();

  const {
    theme: {
      messageInput: { attachButtonContainer },
    },
  } = useTheme();

  useEffect(() => {
    rotation.value = withTiming(selectedPicker !== undefined ? 45 : 0, { duration: 200 });
  }, [selectedPicker, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasAttachmentUploadCapabilities =
    (hasCameraPicker || hasFilePicker || hasImagePicker) && ownCapabilitiesUploadFile;

  if (!hasAttachmentUploadCapabilities && !hasCommands) {
    return null;
  }

  return hasAttachmentUploadCapabilities && !command ? (
    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
      <Animated.View style={[styles.attachButtonContainer, attachButtonContainer, animatedStyle]}>
        <AttachButton />
      </Animated.View>
    </Animated.View>
  ) : null;
};

const areEqual = (
  prevProps: InputButtonsWithContextProps,
  nextProps: InputButtonsWithContextProps,
) => {
  const {
    hasCameraPicker: prevHasCameraPicker,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
  } = prevProps;

  const {
    hasCameraPicker: nextHasCameraPicker,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
  } = nextProps;

  if (prevHasCameraPicker !== nextHasCameraPicker) {
    return false;
  }

  if (prevHasImagePicker !== nextHasImagePicker) {
    return false;
  }

  if (prevHasFilePicker !== nextHasFilePicker) {
    return false;
  }

  return true;
};

const MemoizedInputButtonsWithContext = React.memo(
  InputButtonsWithContext,
  areEqual,
) as typeof InputButtonsWithContext;

export const InputButtons = (props: InputButtonsProps) => {
  const { AttachButton, hasCameraPicker, hasCommands, hasFilePicker, hasImagePicker } =
    useMessageInputContext();
  const { uploadFile } = useOwnCapabilitiesContext();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        hasCameraPicker,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        uploadFile,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachButtonContainer: {},
});
