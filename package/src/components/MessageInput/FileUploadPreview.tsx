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
import { isAudioPackageAvailable } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { FileState, getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../utils/utils';
import { getFileSizeDisplayText } from '../Attachment/FileAttachment';
import { WritingDirectionAwareText } from '../RTLComponents/WritingDirectionAwareText';

const FILE_PREVIEW_HEIGHT = 60;
const WARNING_ICON_SIZE = 16;

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    height: 24,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
  },
  fileContainer: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  fileContentContainer: { flexDirection: 'row' },
  fileIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
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
      colors: { accent_red, grey, grey_dark },
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
      <Text style={[styles.unsupportedFileText, { color: grey_dark }]}>
        {t('File type not supported')}
      </Text>
    </View>
  ) : (
    <WritingDirectionAwareText style={[styles.fileSizeText, { color: grey }, fileSizeText]}>
      {item.file.duration || getFileSizeDisplayText(item.file.size)}
    </WritingDirectionAwareText>
  );
};

type FileUploadPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'fileUploads' | 'removeFile' | 'uploadFile' | 'setFileUploads' | 'AudioAttachment'
> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'FileAttachmentIcon'>;

const FileUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: FileUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const {
    AudioAttachment,
    FileAttachmentIcon,
    fileUploads,
    removeFile,
    setFileUploads,
    uploadFile,
  } = props;

  const flatListRef = useRef<FlatList<FileUpload> | null>(null);
  const [flatListWidth, setFlatListWidth] = useState(0);

  // Handler triggered when an audio is loaded in the message input. The initial state is defined for the audio here and the duration is set.
  const onLoad = (index: string, duration: number) => {
    setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => ({
        ...fileUpload,
        duration: fileUpload.id === index ? duration : fileUpload.duration,
      })),
    );
  };

  // The handler which is triggered when the audio progresses/ the thumb is dragged in the progress control. The progressed duration is set here.
  const onProgress = (index: string, currentTime?: number, hasEnd?: boolean) => {
    setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => ({
        ...fileUpload,
        progress:
          fileUpload.id === index
            ? hasEnd
              ? 1
              : currentTime
              ? currentTime / (fileUpload.duration as number)
              : 0
            : fileUpload.progress,
      })),
    );
  };

  // The handler which controls or sets the paused/played state of the audio.
  const onPlayPause = (index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // If the status is false we set the audio with the index as playing and the others as paused.
      setFileUploads((prevFileUploads) =>
        prevFileUploads.map((fileUpload) => ({
          ...fileUpload,
          paused: fileUpload.id === index ? false : true,
        })),
      );
    } else {
      // If the status is true we simply set all the audio's paused state as true.
      setFileUploads((prevFileUploads) =>
        prevFileUploads.map((fileUpload) => ({
          ...fileUpload,
          paused: true,
        })),
      );
    }
  };

  const {
    theme: {
      colors: { black, grey_dark, grey_gainsboro, grey_whisper },
      messageInput: {
        fileUploadPreview: {
          audioAttachmentFileContainer,
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

    const lastIndexOfDot = item.file.name.lastIndexOf('.');

    return (
      <>
        <UploadProgressIndicator
          action={() => {
            uploadFile({ newFile: item });
          }}
          style={styles.overlay}
          type={indicatorType}
        >
          {item.file.type?.startsWith('audio/') && isAudioPackageAvailable() ? (
            <View
              style={[
                { marginBottom: item.state === FileState.UPLOADED ? 8 : 0 },
                audioAttachmentFileContainer,
              ]}
            >
              <AudioAttachment
                index={index}
                item={item}
                onLoad={onLoad}
                onPlayPause={onPlayPause}
                onProgress={onProgress}
                testID='audio-attachment-upload-preview'
              />
            </View>
          ) : (
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
                <View style={styles.fileIcon}>
                  <FileAttachmentIcon mimeType={item.file.type} />
                </View>
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
                    {item.file.name.slice(0, 12) + '...' + item.file.name.slice(lastIndexOfDot)}
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
          )}
          <TouchableOpacity
            onPress={() => {
              removeFile(item.id);
            }}
            style={[styles.dismiss, { backgroundColor: grey_gainsboro }, dismiss]}
            testID='remove-file-upload-preview'
          >
            <Close pathFill={grey_dark} />
          </TouchableOpacity>
        </UploadProgressIndicator>
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
      keyExtractor={(item) => `${item.id}`}
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
      (prevFileUpload, index) =>
        prevFileUpload.state === nextFileUploads[index].state &&
        prevFileUpload.paused === nextFileUploads[index].paused &&
        prevFileUpload.progress === nextFileUploads[index].progress &&
        prevFileUpload.duration === nextFileUploads[index].duration,
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
  const { AudioAttachment, fileUploads, removeFile, setFileUploads, uploadFile } =
    useMessageInputContext<StreamChatGenerics>();
  const { FileAttachmentIcon } = useMessagesContext<StreamChatGenerics>();

  return (
    <MemoizedFileUploadPreview
      {...{
        AudioAttachment,
        FileAttachmentIcon,
        fileUploads,
        removeFile,
        setFileUploads,
        uploadFile,
      }}
      {...props}
    />
  );
};

FileUploadPreview.displayName = 'FileUploadPreview{messageInput{fileUploadPreview}}';
