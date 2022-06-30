import React, { useEffect, useRef, useState } from 'react';
import { FlatList, I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import {
  FileUpload,
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Close } from '../../icons/Close';
import { Warning } from '../../icons/Warning';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../utils/utils';
import { getFileSizeDisplayText } from '../Attachment/FileAttachment';
import { RTLTextComponent } from '../RTLComponents/RTLTextComponent';

const FILE_PREVIEW_HEIGHT = 60;
const WARNING_ICON_SIZE = 16;

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    height: 24,
    position: 'absolute',
    right: 14,
    top: 4,
    width: 24,
  },
  fileContainer: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
  },
  fileContentContainer: { flexDirection: 'row' },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  fileSizeText: {
    fontSize: 12,
    paddingHorizontal: 10,
  },
  fileTextContainer: {
    height: '100%',
    justifyContent: 'space-around',
  },
  flatList: { marginBottom: 12, maxHeight: FILE_PREVIEW_HEIGHT * 2.5 + 16 },
  overlay: {
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  unsupportedFile: {
    flexDirection: 'row',
    paddingLeft: 10,
  },
  unsupportedFileText: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  warningIconStyle: {
    borderRadius: 24,
    marginTop: 2,
  },
});

const UnsupportedFileTypeOrFileSizeIndicator = ({
  indicatorType,
  item,
}: {
  indicatorType: typeof ProgressIndicatorTypes[keyof typeof ProgressIndicatorTypes];
  item: FileUpload;
}) => {
  const {
    theme: {
      colors: { accent_red, grey },
      messageInput: {
        fileUploadPreview: { fileSizeText },
      },
    },
  } = useTheme();

  const { t } = useTranslationContext();
  return indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
    <View style={styles.unsupportedFile}>
      <Warning
        height={WARNING_ICON_SIZE}
        pathFill={accent_red}
        style={styles.warningIconStyle}
        width={WARNING_ICON_SIZE}
      />
      <Text style={[styles.unsupportedFileText, { color: grey }]}>
        {t('File type not supported')}
      </Text>
    </View>
  ) : (
    <RTLTextComponent style={[styles.fileSizeText, { color: grey }, fileSizeText]}>
      {item.file.duration || getFileSizeDisplayText(item.file.size)}
    </RTLTextComponent>
  );
};

type FileUploadPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'fileUploads' | 'removeFile' | 'uploadFile'
> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'FileAttachmentIcon'>;

const FileUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { FileAttachmentIcon, fileUploads, removeFile, uploadFile } = props;

  const flatListRef = useRef<FlatList<FileUpload> | null>(null);
  const [flatListWidth, setFlatListWidth] = useState(0);

  const {
    theme: {
      colors: { black, grey_whisper, overlay },
      messageInput: {
        fileUploadPreview: {
          dismiss,
          fileContainer,
          fileContentContainer,
          filenameText,
          fileTextContainer,
          flatList,
        },
      },
    },
  } = useTheme();

  const renderItem = ({ index, item }: { index: number; item: FileUpload }) => {
    const indicatorType = getIndicatorTypeForFileState(item.state);

    return (
      <>
        <UploadProgressIndicator
          action={() => {
            uploadFile({ newFile: item });
          }}
          style={styles.overlay}
          type={indicatorType}
        >
          <View
            style={[
              styles.fileContainer,
              index === fileUploads.length - 1
                ? {
                    marginBottom: 0,
                  }
                : {},
              {
                borderColor: grey_whisper,
                width: flatListWidth - 16,
              },
              fileContainer,
            ]}
          >
            <View style={[styles.fileContentContainer, fileContentContainer]}>
              <FileAttachmentIcon mimeType={item.file.type} />
              <View style={[styles.fileTextContainer, fileTextContainer]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filenameText,
                    {
                      color: black,
                      width:
                        flatListWidth -
                        16 - // 16 = horizontal padding
                        40 - // 40 = file icon size
                        24 - // 24 = close icon size
                        24, // 24 = internal padding
                    },
                    I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
                    filenameText,
                  ]}
                >
                  {item.file.name || ''}
                </Text>
                {indicatorType !== null && (
                  <UnsupportedFileTypeOrFileSizeIndicator
                    indicatorType={indicatorType}
                    item={item}
                  />
                )}
              </View>
            </View>
          </View>
        </UploadProgressIndicator>
        <TouchableOpacity
          onPress={() => {
            removeFile(item.id);
          }}
          style={[styles.dismiss, { backgroundColor: overlay }, dismiss]}
          testID='remove-file-upload-preview'
        >
          <Close />
        </TouchableOpacity>
      </>
    );
  };

  const fileUploadsLength = fileUploads.length;

  useEffect(() => {
    if (fileUploadsLength && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 1);
    }
  }, [fileUploadsLength]);

  return fileUploadsLength ? (
    <FlatList
      data={fileUploads}
      getItemLayout={(_, index) => ({
        index,
        length: FILE_PREVIEW_HEIGHT + 8,
        offset: (FILE_PREVIEW_HEIGHT + 8) * index,
      })}
      keyExtractor={(item) => item.id}
      onLayout={({
        nativeEvent: {
          layout: { width },
        },
      }) => {
        setFlatListWidth(width);
      }}
      ref={flatListRef}
      renderItem={renderItem}
      style={[styles.flatList, flatList]}
    />
  ) : null;
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: FileUploadPreviewPropsWithContext<StreamChatGenerics>,
  nextProps: FileUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { fileUploads: prevFileUploads } = prevProps;
  const { fileUploads: nextFileUploads } = nextProps;

  return (
    prevFileUploads.length === nextFileUploads.length &&
    prevFileUploads.every(
      (prevFileUpload, index) => prevFileUpload.state === nextFileUploads[index].state,
    )
  );
};

const MemoizedFileUploadPreview = React.memo(
  FileUploadPreviewWithContext,
  areEqual,
) as typeof FileUploadPreviewWithContext;

export type FileUploadPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<FileUploadPreviewPropsWithContext<StreamChatGenerics>>;

/**
 * FileUploadPreview
 * UI Component to preview the files set for upload
 */
export const FileUploadPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileUploadPreviewProps<StreamChatGenerics>,
) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext<StreamChatGenerics>();

  const { FileAttachmentIcon } = useMessagesContext<StreamChatGenerics>();

  return (
    <MemoizedFileUploadPreview
      {...{ FileAttachmentIcon, fileUploads, removeFile, uploadFile }}
      {...props}
    />
  );
};

FileUploadPreview.displayName = 'FileUploadPreview{messageInput{fileUploadPreview}}';
