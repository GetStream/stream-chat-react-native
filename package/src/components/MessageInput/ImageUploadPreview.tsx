import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import { ChatContextValue, useChatContext } from '../../contexts';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Close } from '../../icons/Close';
import { Warning } from '../../icons/Warning';
import type { FileUpload } from '../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../utils/utils';

const IMAGE_PREVIEW_SIZE = 100;
const WARNING_ICON_SIZE = 16;

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  fileSizeText: {
    fontSize: 12,
    paddingHorizontal: 10,
  },
  flatList: { paddingBottom: 12 },
  iconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    height: IMAGE_PREVIEW_SIZE,
    marginLeft: 8,
  },
  unsupportedImage: {
    borderRadius: 20,
    bottom: 8,
    flexDirection: 'row',
    marginHorizontal: 3,
    position: 'absolute',
  },
  upload: {
    borderRadius: 10,
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
  warningIconStyle: {
    borderRadius: 24,
    marginTop: 6,
  },
  warningText: {
    alignItems: 'center',
    color: 'black',
    fontSize: 10,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});

type ImageUploadPreviewPropsWithContext = Pick<
  MessageInputContextValue,
  'imageUploads' | 'removeImage' | 'uploadImage'
> &
  Pick<ChatContextValue, 'enableOfflineSupport'>;

export type ImageUploadPreviewProps = Partial<ImageUploadPreviewPropsWithContext>;

type ImageUploadPreviewItem = { index: number; item: FileUpload };

export const UnsupportedImageTypeIndicator = ({
  indicatorType,
}: {
  indicatorType: (typeof ProgressIndicatorTypes)[keyof typeof ProgressIndicatorTypes] | null;
}) => {
  const {
    theme: {
      colors: { accent_red, overlay, white },
    },
  } = useTheme();

  const { t } = useTranslationContext();
  return indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
    <View style={[styles.unsupportedImage, { backgroundColor: overlay }]}>
      <View style={[styles.iconContainer]}>
        <Warning
          height={WARNING_ICON_SIZE}
          pathFill={accent_red}
          style={styles.warningIconStyle}
          width={WARNING_ICON_SIZE}
        />
        <Text style={[styles.warningText, { color: white }]}>{t<string>('Not supported')}</Text>
      </View>
    </View>
  ) : null;
};

const ImageUploadPreviewWithContext = (props: ImageUploadPreviewPropsWithContext) => {
  const { enableOfflineSupport, imageUploads, removeImage, uploadImage } = props;

  const {
    theme: {
      messageInput: {
        imageUploadPreview: { flatList, itemContainer, upload },
      },
    },
  } = useTheme();

  const renderItem = ({ index, item }: ImageUploadPreviewItem) => {
    const indicatorType = getIndicatorTypeForFileState(item.state, enableOfflineSupport);
    const itemMarginForIndex = index === imageUploads.length - 1 ? { marginRight: 8 } : {};

    return (
      <View style={[styles.itemContainer, itemMarginForIndex, itemContainer]}>
        <UploadProgressIndicator
          action={() => {
            uploadImage({ newImage: item });
          }}
          style={styles.upload}
          type={indicatorType}
        >
          <Image
            resizeMode='cover'
            source={{ uri: item.file.uri || item.url }}
            style={[styles.upload, upload]}
          />
        </UploadProgressIndicator>
        <DismissUpload
          onPress={() => {
            removeImage(item.id);
          }}
        />
        <UnsupportedImageTypeIndicator indicatorType={indicatorType} />
      </View>
    );
  };

  return imageUploads.length > 0 ? (
    <FlatList
      data={imageUploads}
      getItemLayout={(_, index) => ({
        index,
        length: IMAGE_PREVIEW_SIZE + 8,
        offset: (IMAGE_PREVIEW_SIZE + 8) * index,
      })}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={[styles.flatList, flatList]}
    />
  ) : null;
};

type DismissUploadProps = Pick<TouchableOpacityProps, 'onPress'>;

const DismissUpload = ({ onPress }: DismissUploadProps) => {
  const {
    theme: {
      colors: { overlay, white },
      messageInput: {
        imageUploadPreview: { dismiss, dismissIconColor },
      },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.dismiss, { backgroundColor: overlay }, dismiss]}
      testID='remove-image-upload-preview'
    >
      <Close pathFill={dismissIconColor || white} />
    </TouchableOpacity>
  );
};

const areEqual = (
  prevProps: ImageUploadPreviewPropsWithContext,
  nextProps: ImageUploadPreviewPropsWithContext,
) => {
  const { imageUploads: prevImageUploads } = prevProps;
  const { imageUploads: nextImageUploads } = nextProps;

  return (
    prevImageUploads.length === nextImageUploads.length &&
    prevImageUploads.every(
      (prevImageUpload, index) => prevImageUpload.state === nextImageUploads[index].state,
    )
  );
};

const MemoizedImageUploadPreviewWithContext = React.memo(
  ImageUploadPreviewWithContext,
  areEqual,
) as typeof ImageUploadPreviewWithContext;

/**
 * UI Component to preview the images set for upload
 */
export const ImageUploadPreview = (props: ImageUploadPreviewProps) => {
  const { enableOfflineSupport } = useChatContext();
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext();

  return (
    <MemoizedImageUploadPreviewWithContext
      {...{ imageUploads, removeImage, uploadImage }}
      {...{ enableOfflineSupport }}
      {...props}
    />
  );
};

ImageUploadPreview.displayName = 'ImageUploadPreview{messageInput{imageUploadPreview}}';
