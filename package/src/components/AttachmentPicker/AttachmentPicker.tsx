import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  ImageBackground,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetHandleProps,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { lookup } from 'mime-types';

import type { AttachmentPickerErrorProps } from './components/AttachmentPickerError';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../icons';
import { getLocalAssetUri, getPhotos } from '../../native';
import type { Asset, File } from '../../types/types';
import { vh, vw } from '../../utils/utils';

dayjs.extend(duration);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  durationText: {
    fontWeight: 'bold',
  },
  overlay: {
    alignItems: 'flex-end',
    flex: 1,
  },
  videoView: {
    bottom: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    position: 'absolute',
    width: '100%',
  },
});

const screenHeight = vh(100);
const fullScreenHeight = Dimensions.get('window').height;

export type AttachmentPickerItemType = {
  asset: Asset;
  ImageOverlaySelectedComponent: React.ComponentType;
  maxNumberOfFiles: number;
  numberOfUploads: number;
  selected: boolean;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  numberOfAttachmentPickerImageColumns?: number;
};

type AttachmentImageProps = Omit<AttachmentPickerItemType, 'setSelectedFiles'>;

type AttachmentVideoProps = Omit<AttachmentPickerItemType, 'setSelectedImages'>;

const AttachmentVideo: React.FC<AttachmentVideoProps> = (props) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    setSelectedFiles,
  } = props;

  const {
    theme: {
      attachmentPicker: { durationText, image, imageOverlay },
      colors: { overlay, white },
    },
  } = useTheme();

  const { duration, playableDuration, uri } = asset;

  const videoDuration = duration ? duration : playableDuration;

  const ONE_HOUR_IN_SECONDS = 3600;

  let durationLabel = '00:00';

  if (videoDuration) {
    const isDurationLongerThanHour = videoDuration / ONE_HOUR_IN_SECONDS >= 1;
    const formattedDurationParam = isDurationLongerThanHour ? 'HH:mm:ss' : 'mm:ss';
    const formattedVideoDuration = dayjs
      .duration(videoDuration, 'second')
      .format(formattedDurationParam);
    durationLabel = formattedVideoDuration;
  }

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const onPressVideo = async () => {
    // For the case of expo messaging app where you need to fetch the asset uri from asset id
    const localAssetURI = asset.id && (await getLocalAssetUri(asset.id));
    if (selected) {
      setSelectedFiles((files) => files.filter((file) => file.uri !== asset.uri));
    } else {
      setSelectedFiles((files) => {
        if (numberOfUploads >= maxNumberOfFiles) {
          Alert.alert('Maximum number of files reached');
          return files;
        }
        return [
          ...files,
          {
            duration: durationLabel,
            name: asset.filename,
            size: asset.fileSize,
            type: 'video',
            uri: localAssetURI || asset.uri,
          },
        ];
      });
    }
  };

  return (
    <TouchableOpacity onPress={onPressVideo}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        {selected && (
          <View style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}>
            <ImageOverlaySelectedComponent />
          </View>
        )}
        <View style={styles.videoView}>
          <Recorder height={20} pathFill={white} width={25} />
          {videoDuration ? (
            <Text style={[styles.durationText, durationText, { color: white }]}>
              {durationLabel}
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const AttachmentImage: React.FC<AttachmentImageProps> = (props) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    setSelectedImages,
  } = props;
  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
      colors: { overlay },
    },
  } = useTheme();

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const { uri } = asset;

  const onPressImage = () => {
    if (selected) {
      setSelectedImages((images) => images.filter((image) => image.uri !== asset.uri));
    } else {
      setSelectedImages((images) => {
        if (numberOfUploads >= maxNumberOfFiles) {
          Alert.alert('Maximum number of files reached');
          return images;
        }
        return [...images, asset];
      });
    }
  };

  return (
    <TouchableOpacity onPress={onPressImage}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        {selected && (
          <View style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}>
            <ImageOverlaySelectedComponent />
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

const renderItem = ({ item }: { item: AttachmentPickerItemType }) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    setSelectedFiles,
    setSelectedImages,
  } = item;

  const contentType = lookup(asset.filename) || 'multipart/form-data';

  const fileType = asset.filename
    ? contentType.startsWith('image/')
      ? 'image'
      : 'video'
    : asset.type === 'video'
    ? 'video'
    : 'image';

  return fileType === 'image' ? (
    <AttachmentImage
      asset={asset}
      ImageOverlaySelectedComponent={ImageOverlaySelectedComponent}
      maxNumberOfFiles={maxNumberOfFiles}
      numberOfAttachmentPickerImageColumns={numberOfAttachmentPickerImageColumns}
      numberOfUploads={numberOfUploads}
      selected={selected}
      setSelectedImages={setSelectedImages}
    />
  ) : (
    <AttachmentVideo
      asset={asset}
      ImageOverlaySelectedComponent={ImageOverlaySelectedComponent}
      maxNumberOfFiles={maxNumberOfFiles}
      numberOfAttachmentPickerImageColumns={numberOfAttachmentPickerImageColumns}
      numberOfUploads={numberOfUploads}
      selected={selected}
      setSelectedFiles={setSelectedFiles}
    />
  );
};

export type AttachmentPickerProps = {
  /**
   * Custom UI component to render [draggable handle](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) of attachment picker.
   *
   * **Default** [AttachmentPickerBottomSheetHandle](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle.tsx)
   */
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  /**
   * Custom UI component to render error component while opening attachment picker.
   *
   * **Default** [AttachmentPickerError](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerError.tsx)
   */
  AttachmentPickerError: React.ComponentType<AttachmentPickerErrorProps>;
  /**
   * Custom UI component to render error image for attachment picker
   *
   * **Default** [AttachmentPickerErrorImage](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerErrorImage.tsx)
   */
  AttachmentPickerErrorImage: React.ComponentType;
  /**
   * Custom UI component to render overlay component, that shows up on top of [selected image](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) (with tick mark)
   *
   * **Default** [ImageOverlaySelectedComponent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/ImageOverlaySelectedComponent.tsx)
   */
  ImageOverlaySelectedComponent: React.ComponentType;
  attachmentPickerBottomSheetHandleHeight?: number;
  attachmentPickerBottomSheetHeight?: number;
  attachmentPickerErrorButtonText?: string;
  attachmentPickerErrorText?: string;
  numberOfAttachmentImagesToLoadPerCall?: number;
  numberOfAttachmentPickerImageColumns?: number;
  translucentStatusBar?: boolean;
};

export const AttachmentPicker = React.forwardRef(
  (props: AttachmentPickerProps, ref: React.ForwardedRef<BottomSheet>) => {
    const {
      AttachmentPickerBottomSheetHandle,
      attachmentPickerBottomSheetHandleHeight,
      attachmentPickerBottomSheetHeight,
      AttachmentPickerError,
      attachmentPickerErrorButtonText,
      AttachmentPickerErrorImage,
      attachmentPickerErrorText,
      ImageOverlaySelectedComponent,
      numberOfAttachmentImagesToLoadPerCall,
      numberOfAttachmentPickerImageColumns,
      translucentStatusBar,
    } = props;

    const {
      theme: {
        attachmentPicker: { bottomSheetContentContainer },
        colors: { white },
      },
    } = useTheme();
    const {
      closePicker,
      maxNumberOfFiles,
      selectedFiles,
      selectedImages,
      selectedPicker,
      setSelectedFiles,
      setSelectedImages,
      setSelectedPicker,
      topInset,
    } = useAttachmentPickerContext();

    const [currentIndex, setCurrentIndex] = useState(-1);
    const [endCursor, setEndCursor] = useState<string>();
    const [photoError, setPhotoError] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photos, setPhotos] = useState<Asset[]>([]);
    const attemptedToLoadPhotosOnOpenRef = useRef(false);
    const bottomSheetCloseOnKeyboardShowTimeout = useRef<NodeJS.Timeout>();

    const getMorePhotos = useCallback(async () => {
      if (hasNextPage && !loadingPhotos && currentIndex > -1 && selectedPicker === 'images') {
        setLoadingPhotos(true);
        try {
          const results = await getPhotos({
            after: endCursor,
            first: numberOfAttachmentImagesToLoadPerCall ?? 60,
          });
          setPhotoError(false);
          if (endCursor) {
            setPhotos([...photos, ...results.assets]);
          } else {
            setPhotos(results.assets);
          }
          setEndCursor(results.endCursor);
          setHasNextPage(results.hasNextPage || false);
        } catch (error) {
          console.log(error);
          setPhotoError(true);
        }
        setLoadingPhotos(false);
      }
    }, [hasNextPage, loadingPhotos, currentIndex, selectedPicker, endCursor]);

    useEffect(() => {
      const backAction = () => {
        if (selectedPicker) {
          setSelectedPicker(undefined);
          closePicker();
          return true;
        }

        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [selectedPicker, closePicker]);

    useEffect(() => {
      const keyboardSubscription =
        Platform.OS === 'ios'
          ? Keyboard.addListener('keyboardWillShow', closePicker)
          : Keyboard.addListener('keyboardDidShow', closePicker);

      return () => {
        if (keyboardSubscription?.remove) {
          keyboardSubscription.remove();
          return;
        }

        // To keep compatibility with older versions of React Native, where `remove()` is not available
        if (Platform.OS === 'ios') {
          Keyboard.removeListener('keyboardWillShow', closePicker);
        } else {
          Keyboard.removeListener('keyboardDidShow', closePicker);
        }
        if (bottomSheetCloseOnKeyboardShowTimeout.current) {
          clearTimeout(bottomSheetCloseOnKeyboardShowTimeout.current);
        }
      };
    }, [closePicker]);

    useEffect(() => {
      if (currentIndex < 0) {
        setSelectedPicker(undefined);
        if (!loadingPhotos) {
          setEndCursor(undefined);
          setHasNextPage(true);
          attemptedToLoadPhotosOnOpenRef.current = false;
        }
      }
    }, [currentIndex, loadingPhotos]);

    useEffect(() => {
      if (
        !attemptedToLoadPhotosOnOpenRef.current &&
        selectedPicker === 'images' &&
        endCursor === undefined &&
        currentIndex > -1 &&
        !loadingPhotos
      ) {
        getMorePhotos();
        // we do this only once on open for avoiding to request permissions in rationale dialog again and again on Android
        attemptedToLoadPhotosOnOpenRef.current = true;
      }
    }, [currentIndex, selectedPicker, endCursor, getMorePhotos, loadingPhotos]);

    const selectedPhotos = photos.map((asset) => ({
      asset,
      ImageOverlaySelectedComponent,
      maxNumberOfFiles,
      numberOfAttachmentPickerImageColumns,
      numberOfUploads: selectedFiles.length + selectedImages.length,
      selected:
        selectedImages.some((image) => image.uri === asset.uri) ||
        selectedFiles.some((file) => file.uri === asset.uri),
      setSelectedFiles,
      setSelectedImages,
    }));

    const handleHeight = attachmentPickerBottomSheetHandleHeight || 20;

    /**
     * This is to handle issues with Android measurements coming back incorrect.
     * If the StatusBar height is perfectly 1/2 of the difference between the two
     * dimensions for screen and window, it is incorrect and we need to account for
     * this. If you use a translucent header bar more adjustments are needed.
     */
    const statusBarHeight = StatusBar.currentHeight ?? 0;
    const bottomBarHeight = fullScreenHeight - screenHeight - statusBarHeight;
    const androidBottomBarHeightAdjustment =
      Platform.OS === 'android'
        ? bottomBarHeight === statusBarHeight
          ? translucentStatusBar
            ? 0
            : StatusBar.currentHeight ?? 0
          : translucentStatusBar
          ? bottomBarHeight > statusBarHeight
            ? -bottomBarHeight + statusBarHeight
            : bottomBarHeight > 0
            ? -statusBarHeight
            : 0
          : bottomBarHeight > 0
          ? 0
          : statusBarHeight
        : 0;

    const initialSnapPoint =
      attachmentPickerBottomSheetHeight ?? Platform.OS === 'android'
        ? 308 + (fullScreenHeight - screenHeight + androidBottomBarHeightAdjustment) - handleHeight
        : 308 + (fullScreenHeight - screenHeight + androidBottomBarHeightAdjustment);

    const finalSnapPoint =
      Platform.OS === 'android'
        ? fullScreenHeight - topInset - handleHeight
        : fullScreenHeight - topInset;

    /**
     * Snap points changing cause a rerender of the position,
     * this is an issue if you are calling close on the bottom sheet.
     */
    const snapPoints = useMemo(
      () => [initialSnapPoint, finalSnapPoint],
      [initialSnapPoint, finalSnapPoint],
    );

    return (
      <>
        <BottomSheet
          containerHeight={fullScreenHeight}
          enablePanDownToClose={true}
          handleComponent={
            /**
             * using `null` here instead of `style={{ opacity: photoError ? 0 : 1 }}`
             * as opacity is not an allowed style
             */
            photoError ? null : AttachmentPickerBottomSheetHandle
          }
          handleHeight={handleHeight}
          index={-1}
          onChange={setCurrentIndex}
          ref={ref}
          snapPoints={snapPoints}
        >
          <BottomSheetFlatList
            contentContainerStyle={[
              styles.container,
              { backgroundColor: white },
              bottomSheetContentContainer,
              { opacity: photoError ? 0 : 1 },
            ]}
            data={selectedPhotos}
            keyExtractor={(item) => item.asset.uri}
            numColumns={numberOfAttachmentPickerImageColumns ?? 3}
            onEndReached={getMorePhotos}
            renderItem={renderItem}
          />
        </BottomSheet>
        {selectedPicker === 'images' && photoError && (
          <AttachmentPickerError
            attachmentPickerBottomSheetHeight={initialSnapPoint}
            attachmentPickerErrorButtonText={attachmentPickerErrorButtonText}
            AttachmentPickerErrorImage={AttachmentPickerErrorImage}
            attachmentPickerErrorText={attachmentPickerErrorText}
          />
        )}
      </>
    );
  },
);

AttachmentPicker.displayName = 'AttachmentPicker';
