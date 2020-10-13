import React from 'react';
import { ActionSheetCustom } from 'react-native-actionsheet';

import type {
  ImageRequireSource,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { IconSquare } from '../IconSquare';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { styled } from '../../styles/styledComponents';

const iconGallery: ImageRequireSource = require('../../images/icons/icon_attach-media.png');
const iconClose: ImageRequireSource = require('../../images/icons/icon_close.png');
const iconFolder: ImageRequireSource = require('../../images/icons/icon_folder.png');

const ActionSheetButtonContainer = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: flex-start;
  padding-left: 20px;
  width: 100%;
  ${({ theme }) => theme.messageInput.actionSheet.buttonContainer.css};
`;

const ActionSheetButtonText = styled.Text`
  ${({ theme }) => theme.messageInput.actionSheet.buttonText.css};
`;

const ActionSheetTitleContainer = styled.View`
  align-items: center;
  flex-direction: row;
  height: 100%;
  justify-content: space-between;
  padding-horizontal: 20px;
  width: 100%;
  ${({ theme }) => theme.messageInput.actionSheet.titleContainer.css};
`;

const ActionSheetTitleText = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.actionSheet.titleText.css};
`;

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
  return (
    <ActionSheetButtonContainer key={key} testID={testID}>
      <IconSquare icon={icon} />
      <ActionSheetButtonText>{text}</ActionSheetButtonText>
    </ActionSheetButtonContainer>
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
    styles,
  } = props;

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
      styles={styles}
      title={
        <ActionSheetTitleContainer>
          <ActionSheetTitleText>{t('Add a file')}</ActionSheetTitleText>
          <IconSquare icon={iconClose} onPress={closeAttachActionSheet} />
        </ActionSheetTitleContainer>
      }
    />
  );
};
