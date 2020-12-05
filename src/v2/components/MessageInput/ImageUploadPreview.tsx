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

import {
  ImageUpload,
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
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

type ImageUploadPreviewPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'imageUploads' | 'removeImage' | 'uploadImage'
>;

export type ImageUploadPreviewProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

const ImageUploadPreviewWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { imageUploads, removeImage, uploadImage } = props;

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
          uploadImage({ newImage: item });
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
          removeImage(item.id);
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

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { imageUploads: prevImageUploads } = prevProps;
  const { imageUploads: nextImageUploads } = nextProps;

  return (
    prevImageUploads.length === nextImageUploads.length &&
    prevImageUploads.every(
      (prevImageUpload, index) =>
        prevImageUpload.state === nextImageUploads[index].state,
    )
  );
};

const MemoizedImageUploadPreviewWithContext = React.memo(
  ImageUploadPreviewWithContext,
  areEqual,
) as typeof ImageUploadPreviewWithContext;

/**
 * UI Component to preview the images set for upload
 *
 * @example ./ImageUploadPreview.md
 */
export const ImageUploadPreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ImageUploadPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedImageUploadPreviewWithContext
      {...{ imageUploads, removeImage, uploadImage }}
      {...props}
    />
  );
};

ImageUploadPreview.displayName =
  'ImageUploadPreview{messageInput{imageUploadPreview}}';
