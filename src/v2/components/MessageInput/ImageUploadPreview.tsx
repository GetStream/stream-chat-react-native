import React from 'react';
import {
  FlatList,
  Image,
  ImageRequireSource,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import type { ImageUpload } from './hooks/useMessageDetailsForState';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

const closeRound: ImageRequireSource = require('../../../images/icons/close-round.png');

const styles = StyleSheet.create({
  container: {
    height: 70,
    padding: 10,
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
  itemContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    height: 50,
    marginLeft: 5,
  },
  upload: {
    borderRadius: 10,
    height: 50,
    width: 50,
  },
});

export type ImageUploadPreviewProps = {
  /**
   * An array of image objects which are set for upload. It has the following structure:
   *
   * ```json
   *  [
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_1",
   *      "state": "uploading" // or "finished",
   *    },
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_2",
   *      "state": "uploading" // or "finished",
   *    },
   *  ]
   * ```
   *
   */
  imageUploads: ImageUpload[];
  /**
   * Function for removing an image from the upload preview
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  removeImage: (id: string) => void;
  /**
   * Function for attempting to upload an image
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  retryUpload: ({ newImage }: { newImage: ImageUpload }) => Promise<void>;
};

/**
 * UI Component to preview the images set for upload
 *
 * @example ./ImageUploadPreview.md
 */
export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = (
  props,
) => {
  const { imageUploads, removeImage, retryUpload } = props;

  const {
    theme: {
      messageInput: {
        imageUploadPreview: {
          container,
          dismiss,
          dismissImage,
          itemContainer,
          upload,
        },
      },
    },
  } = useTheme();

  const renderItem = ({ item }: { item: ImageUpload }) => (
    <View style={[styles.itemContainer, itemContainer]}>
      <UploadProgressIndicator
        action={() => {
          if (retryUpload) {
            retryUpload({ newImage: item });
          }
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
        <Image
          resizeMode='cover'
          source={{ uri: item.file.uri || item.url }}
          style={[styles.upload, upload]}
        />
      </UploadProgressIndicator>
      <TouchableOpacity
        onPress={() => {
          if (removeImage) {
            removeImage(item.id);
          }
        }}
        style={[styles.dismiss, dismiss]}
        testID='remove-image-upload-preview'
      >
        <Image
          source={closeRound}
          style={[styles.dismissImage, dismissImage]}
        />
      </TouchableOpacity>
    </View>
  );

  return imageUploads?.length > 0 ? (
    <View style={[styles.container, container]}>
      <FlatList
        data={imageUploads}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
      />
    </View>
  ) : null;
};

ImageUploadPreview.displayName =
  'ImageUploadPreview{messageInput{imageUploadPreview}}';
