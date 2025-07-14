import React, { useEffect, useRef } from 'react';
import { Animated, Easing, LayoutRectangle, Platform, Pressable, StyleSheet } from 'react-native';

import {
  useChannelContext,
  useMessagesContext,
  useOwnCapabilitiesContext,
} from '../../../contexts';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { CreatePollIcon } from '../../Poll/components/CreatePollIcon';

type NativeAttachmentPickerProps = {
  onRequestedClose: () => void;
  attachButtonLayoutRectangle?: LayoutRectangle;
};

const TOP_PADDING = 4;
const ATTACH_MARGIN_BOTTOM = 4;

export const NativeAttachmentPicker = ({
  attachButtonLayoutRectangle,
  onRequestedClose,
}: NativeAttachmentPickerProps) => {
  const size = attachButtonLayoutRectangle?.width ?? 0;
  const attachButtonItemSize = 40;
  const {
    theme: {
      colors: { grey_whisper },
      messageInput: {
        nativeAttachmentPicker: {
          buttonContainer,
          buttonDimmerStyle: buttonDimmerStyleTheme,
          container,
        },
      },
    },
  } = useTheme();
  const {
    CameraSelectorIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    VideoRecorderSelectorIcon,
    hasCameraPicker,
    hasFilePicker,
    hasImagePicker,
    openPollCreationDialog,
    pickAndUploadImageFromNativePicker,
    pickFile,
    sendMessage,
    takeAndUploadImage,
  } = useMessageInputContext();
  const { threadList } = useChannelContext();
  const { hasCreatePoll } = useMessagesContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const popupHeight =
    // the top padding
    TOP_PADDING +
    // take margins into account
    ATTACH_MARGIN_BOTTOM +
    // the size of the attachment icon items (same size as attach button * amount of attachment button types)
    attachButtonItemSize;

  const containerPopupStyle = {
    borderTopEndRadius: size / 2,
    // the popup should be rounded as the attach button
    borderTopStartRadius: size / 2,
    height: popupHeight,
    // from the same side horizontal coordinate of the attach button
    left: attachButtonLayoutRectangle?.x,
    // we should show the popup right above the attach button and not top of it
    top: (attachButtonLayoutRectangle?.y ?? 0) - popupHeight,
    // the width of the popup should be the same as the attach button
    width: size,
  };

  const elasticAnimRef = useRef(new Animated.Value(0.5)); // Initial value for scale: 0.5

  useEffect(() => {
    Animated.timing(elasticAnimRef.current, {
      duration: 150,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const buttonStyle = {
    borderRadius: attachButtonItemSize / 2,
    height: attachButtonItemSize,
    width: attachButtonItemSize,
  };

  const buttonDimmerStyle = {
    ...styles.attachButtonDimmer,
    height: size,
    // from the same side horizontal coordinate of the attach button
    left: attachButtonLayoutRectangle?.x,
    // we should show the popup right on top of the attach button
    top: attachButtonLayoutRectangle?.y ?? 0 - popupHeight + size,
    width: size,
  };

  const onClose = ({
    onPressHandler,
  }: {
    onPressHandler?: (() => Promise<void>) | (() => void);
  }) => {
    if (onPressHandler) {
      onPressHandler();
    }
    Animated.timing(elasticAnimRef.current, {
      duration: 150,
      easing: Easing.linear,
      toValue: 0.2,
      useNativeDriver: true,
    }).start(onRequestedClose);
  };

  // do not allow poll creation in threads
  const buttons =
    !threadList && hasCreatePoll && ownCapabilities.sendPoll
      ? [
          {
            icon: <CreatePollIcon />,
            id: 'Poll',
            onPressHandler: () => {
              openPollCreationDialog?.({ sendMessage });
            },
          },
        ]
      : [];

  if (hasImagePicker) {
    buttons.push({
      icon: <ImageSelectorIcon />,
      id: 'Image',
      onPressHandler: pickAndUploadImageFromNativePicker,
    });
  }
  if (hasFilePicker) {
    buttons.push({ icon: <FileSelectorIcon />, id: 'File', onPressHandler: pickFile });
  }
  if (hasCameraPicker) {
    buttons.push({
      icon: <CameraSelectorIcon />,
      id: 'Camera',
      onPressHandler: () => {
        takeAndUploadImage(Platform.OS === 'android' ? 'image' : 'mixed');
      },
    });
    if (Platform.OS === 'android') {
      buttons.push({
        icon: <VideoRecorderSelectorIcon />,
        id: 'Video',
        onPressHandler: () => {
          takeAndUploadImage('video');
        },
      });
    }
  }

  return (
    <>
      <Pressable
        onPress={() => {
          onClose({});
        }}
        style={[styles.container, containerPopupStyle, container]}
        testID={'native-attachment-picker'}
      >
        {/* all the attach buttons */}
        {buttons.map(({ icon, id, onPressHandler }) => (
          <Pressable key={id} onPress={() => onClose({ onPressHandler })}>
            <Animated.View
              style={[
                styles.buttonContainer,
                buttonStyle,
                {
                  // temporary background color until we have theming
                  backgroundColor: grey_whisper,
                },
                {
                  transform: [
                    {
                      scaleY: elasticAnimRef.current,
                    },
                    {
                      scaleX: elasticAnimRef.current,
                    },
                  ],
                },
                buttonContainer,
              ]}
            >
              {icon}
            </Animated.View>
          </Pressable>
        ))}
      </Pressable>
      {/* a square view with 50% opacity that semi hides the attach button */}
      <Pressable onPress={() => onClose({})} style={[buttonDimmerStyle, buttonDimmerStyleTheme]} />
    </>
  );
};

const styles = StyleSheet.create({
  attachButtonDimmer: {
    opacity: 0,
    position: 'absolute',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ATTACH_MARGIN_BOTTOM,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: TOP_PADDING,
    position: 'absolute',
  },
});
