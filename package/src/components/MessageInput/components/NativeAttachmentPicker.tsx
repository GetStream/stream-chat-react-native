import React, { useEffect, useRef } from 'react';
import { Animated, Easing, LayoutRectangle, Pressable, StyleSheet } from 'react-native';

import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { CameraSelectorIcon } from '../../AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon } from '../../AttachmentPicker/components/FileSelectorIcon';
import { ImageSelectorIcon } from '../../AttachmentPicker/components/ImageSelectorIcon';

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
  const NUMBER_OF_BUTTONS = 3;
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
    hasFilePicker,
    hasImagePicker,
    pickAndUploadImageFromNativePicker,
    pickFile,
    takeAndUploadImage,
  } = useMessageInputContext();

  const popupHeight =
    // the top padding
    TOP_PADDING +
    // take margins into account
    ATTACH_MARGIN_BOTTOM * NUMBER_OF_BUTTONS +
    // the size of the attachment icon items (same size as attach button * amount of attachment button types)
    attachButtonItemSize * NUMBER_OF_BUTTONS;

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

  const onClose = ({ onPressHandler }: { onPressHandler?: () => Promise<void> }) => {
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

  const buttons = [];

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
  buttons.push({ icon: <CameraSelectorIcon />, id: 'Camera', onPressHandler: takeAndUploadImage });

  return (
    <>
      <Pressable
        onPress={() => {
          onClose({});
        }}
        style={[styles.container, containerPopupStyle, container]}
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
