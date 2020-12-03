import React from 'react';
import {
  FlatList,
  Image,
  ImageRequireSource,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import type { FileUpload } from './hooks/useMessageDetailsForState';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const closeRound: ImageRequireSource = require('../../../images/icons/close-round.png');

const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

const styles = StyleSheet.create({
  attachmentContainerView: {
    alignItems: 'center',
    borderColor: '#EBEBEB',
    borderWidth: 0.5,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    justifyContent: 'space-between',
    marginBottom: 5,
    padding: FILE_PREVIEW_PADDING,
  },
  attachmentView: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  container: {
    marginHorizontal: 10,
  },
  dismiss: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 20,
  },
  dismissImage: {
    height: 10,
    width: 10,
  },
  filenameText: {
    paddingLeft: 10,
  },
});

type FileUploadPreviewPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'fileUploads' | 'removeFile' | 'uploadFile'
> &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'AttachmentFileIcon'>;

const FileUploadPreviewWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { AttachmentFileIcon, fileUploads, removeFile, uploadFile } = props;

  const {
    theme: {
      messageInput: {
        fileUploadPreview: {
          attachmentContainerView,
          attachmentView,
          container,
          dismiss,
          dismissImage,
          filenameText,
        },
      },
    },
  } = useTheme();

  const renderItem = ({ item }: { item: FileUpload }) => (
    <>
      <UploadProgressIndicator
        action={() => {
          uploadFile({ newFile: item });
        }}
        active={item.state !== FileState.UPLOADED}
        type={
          item.state === FileState.UPLOADING
            ? ProgressIndicatorTypes.IN_PROGRESS
            : item.state === FileState.UPLOAD_FAILED
            ? ProgressIndicatorTypes.RETRY
            : undefined
        }
      >
        <View style={[styles.attachmentContainerView, attachmentContainerView]}>
          <View style={[styles.attachmentView, attachmentView]}>
            <AttachmentFileIcon mimeType={item.file.type} size={20} />
            <Text style={[styles.filenameText, filenameText]}>
              {item.file.name
                ? item.file.name.length > 35
                  ? item.file.name.substring(0, 35).concat('...')
                  : item.file.name
                : ''}
            </Text>
          </View>
        </View>
      </UploadProgressIndicator>
      <TouchableOpacity
        onPress={() => {
          removeFile(item.id);
        }}
        style={[styles.dismiss, dismiss]}
        testID='remove-file-upload-preview'
      >
        <Image
          source={closeRound}
          style={[styles.dismissImage, dismissImage]}
        />
      </TouchableOpacity>
    </>
  );

  return fileUploads?.length > 0 ? (
    <View
      style={[
        styles.container,
        { height: fileUploads.length * (FILE_PREVIEW_HEIGHT + 5) },
        container,
      ]}
    >
      <FlatList
        data={fileUploads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
      />
    </View>
  ) : null;
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: FileUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: FileUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { fileUploads: prevFileUploads } = prevProps;
  const { fileUploads: nextFileUploads } = nextProps;

  return (
    prevFileUploads.length === nextFileUploads.length &&
    prevFileUploads.every(
      (prevFileUpload, index) =>
        prevFileUpload.state === nextFileUploads[index].state,
    )
  );
};

const MemoizedFileUploadPreview = React.memo(
  FileUploadPreviewWithContext,
  areEqual,
) as typeof FileUploadPreviewWithContext;

export type FileUploadPreviewProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<FileUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;
/**
 * FileUploadPreview
 * UI Component to preview the files set for upload
 *
 * @example ./FileUploadPreview.md
 */
export const FileUploadPreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileUploadPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { AttachmentFileIcon } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedFileUploadPreview
      {...{ AttachmentFileIcon, fileUploads, removeFile, uploadFile }}
      {...props}
    />
  );
};

FileUploadPreview.displayName =
  'FileUploadPreview{messageInput{fileUploadPreview}}';
