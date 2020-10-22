import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionSheetCustom } from 'react-native-actionsheet';

import type {
  ImageRequireSource,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { IconSquare } from '../IconSquare';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const iconGallery: ImageRequireSource = require('../../../images/icons/icon_attach-media.png');
const iconClose: ImageRequireSource = require('../../../images/icons/icon_close.png');
const iconFolder: ImageRequireSource = require('../../../images/icons/icon_folder.png');

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  titleText: {
    fontWeight: 'bold',
  },
});

type AttachmentActionSheetItemProps = {
  icon: ImageRequireSource;
  key: string | number;
  text: string;
  testID?: string;
};

const AttachmentActionSheetItem: React.FC<AttachmentActionSheetItemProps> = (
  props,
) => {
  const { icon, key, testID, text } = props;
  const {
    theme: {
      messageInput: {
        actionSheet: { buttonContainer, buttonText },
      },
    },
  } = useTheme();

  return (
    <View
      key={key}
      style={[styles.buttonContainer, buttonContainer]}
      testID={testID}
    >
      <IconSquare icon={icon} />
      <Text style={buttonText}>{text}</Text>
    </View>
  );
};

export type ActionSheetStyles = {
  body?: StyleProp<ViewStyle>;
  buttonBox?: StyleProp<ViewStyle>;
  buttonText?: StyleProp<TextStyle>;
  cancelButtonBox?: StyleProp<ViewStyle>;
  messageBox?: StyleProp<ViewStyle>;
  messageText?: StyleProp<TextStyle>;
  overlay?: StyleProp<TextStyle>;
  titleBox?: StyleProp<ViewStyle>;
  titleText?: StyleProp<TextStyle>;
  wrapper?: StyleProp<ViewStyle>;
};

export type ActionSheetProps = {
  closeAttachActionSheet: () => void;
  pickFile: () => Promise<void>;
  pickImage: () => Promise<void>;
  setAttachActionSheetRef: (ref: ActionSheetCustom | null) => void;
  styles?: ActionSheetStyles;
};

export const ActionSheetAttachment: React.FC<ActionSheetProps> = (props) => {
  const {
    closeAttachActionSheet,
    pickFile,
    pickImage,
    setAttachActionSheetRef,
    styles: stylesProp,
  } = props;

  const {
    theme: {
      messageInput: {
        actionSheet: { titleContainer, titleText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <ActionSheetCustom
      onPress={(index) => {
        // https://github.com/beefe/react-native-actionsheet/issues/36
        setTimeout(() => {
          switch (index) {
            case 0:
              pickImage();
              break;
            case 1:
              pickFile();
              break;
            default:
          }
        }, 201); // 201ms to fire after the animation is complete https://github.com/beefe/react-native-actionsheet/blob/master/lib/ActionSheetCustom.js#L78
      }}
      options={[
        <AttachmentActionSheetItem
          icon={iconGallery}
          key='upload-photo-item'
          testID='upload-photo-item'
          text={t('Upload a photo')}
        />,
        <AttachmentActionSheetItem
          icon={iconFolder}
          key='upload-file-item'
          testID='upload-file-item'
          text={t('Upload a file')}
        />,
      ]}
      ref={setAttachActionSheetRef}
      styles={stylesProp}
      title={
        <View style={[styles.titleContainer, titleContainer]}>
          <Text style={[styles.titleText, titleText]}>{t('Add a file')}</Text>
          <IconSquare icon={iconClose} onPress={closeAttachActionSheet} />
        </View>
      }
    />
  );
};

ActionSheetAttachment.displayName =
  'ActionSheetAttachment{messageInput{actionSheet}}';
