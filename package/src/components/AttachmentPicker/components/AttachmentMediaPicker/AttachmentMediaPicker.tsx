import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { renderAttachmentPickerItem } from './AttachmentPickerItem';

import { useAttachmentPickerContext, useTheme, useTranslationContext } from '../../../../contexts';

import { useStableCallback } from '../../../../hooks';
import { Picture } from '../../../../icons';

import { NativeHandlers } from '../../../../native';
import type { File } from '../../../../types/types';
import { BottomSheetFlatList } from '../../../BottomSheetCompatibility/BottomSheetFlatList';
import {
  AttachmentPickerContentProps,
  AttachmentPickerGenericContent,
} from '../AttachmentPickerContent';

export const IOS_LIMITED_DEEPLINK = '@getstream/ios-limited-button' as const;

export type IosLimitedItemType = { uri: typeof IOS_LIMITED_DEEPLINK };

export type PhotoContentItemType = File | IosLimitedItemType;

export const isIosLimited = (item: PhotoContentItemType): item is IosLimitedItemType =>
  'uri' in item && item.uri === '@getstream/ios-limited-button';

const keyExtractor = (item: PhotoContentItemType) => item.uri;

const useMediaPickerStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexGrow: 1,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
      }),
    [semantics.backgroundCoreElevation1],
  );
};

export const AttachmentMediaPickerIcon = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Picture height={22} stroke={semantics.textTertiary} width={22} />;
};

export const AttachmentMediaPicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { numberOfAttachmentImagesToLoadPerCall, numberOfAttachmentPickerImageColumns } =
    useAttachmentPickerContext();
  const { height } = props;

  const {
    theme: {
      attachmentPicker: { bottomSheetContentContainer },
    },
  } = useTheme();
  const styles = useMediaPickerStyles();

  const numberOfColumns = numberOfAttachmentPickerImageColumns ?? 3;

  const endCursorRef = useRef<string>(undefined);
  const [photoError, setPhotoError] = useState(false);
  const hasNextPageRef = useRef(true);
  const loadingPhotosRef = useRef(false);
  const [photos, setPhotos] = useState<Array<PhotoContentItemType>>([]);
  const attemptedToLoadPhotosOnOpenRef = useRef<boolean>(false);

  const getMorePhotos = useStableCallback(async () => {
    if (hasNextPageRef.current && !loadingPhotosRef.current) {
      setPhotoError(false);
      loadingPhotosRef.current = true;
      const endCursor = endCursorRef.current;
      try {
        if (!NativeHandlers.getPhotos) {
          setPhotos([]);
          return;
        }

        const results = await NativeHandlers.getPhotos({
          after: endCursor,
          first: numberOfAttachmentImagesToLoadPerCall ?? 25,
        });

        endCursorRef.current = results.endCursor;
        // skip updating if the sheet closed in the meantime, to avoid
        // confusing the bottom sheet internals
        setPhotos((prevPhotos) => {
          if (endCursor) {
            return [...prevPhotos, ...results.assets];
          }

          let assets: PhotoContentItemType[] = results.assets;

          if (results.iOSLimited) {
            assets = [{ uri: IOS_LIMITED_DEEPLINK }, ...assets];
          }

          for (let i = 0; i < results.assets.length; i++) {
            if (assets[i].uri !== prevPhotos[i]?.uri) {
              return assets;
            }
          }

          return prevPhotos.slice(0, assets.length);
        });
        hasNextPageRef.current = !!results.hasNextPage;
      } catch (error) {
        setPhotoError(true);
      }
      loadingPhotosRef.current = false;
    }
  });

  useEffect(() => {
    if (!NativeHandlers.oniOS14GalleryLibrarySelectionChange) {
      return;
    }
    // ios 14 library selection change event is fired when user reselects the images that are permitted to be
    // readable by the app
    const { unsubscribe } = NativeHandlers.oniOS14GalleryLibrarySelectionChange(() => {
      // we reset the cursor and has next page to true to facilitate fetching of the first page of photos again
      hasNextPageRef.current = true;
      endCursorRef.current = undefined;
      // fetch the first page of photos again
      getMorePhotos();
    });
    return unsubscribe;
  }, [getMorePhotos]);

  useEffect(() => {
    if (!loadingPhotosRef.current) {
      endCursorRef.current = undefined;
      hasNextPageRef.current = true;
      attemptedToLoadPhotosOnOpenRef.current = false;
      setPhotoError(false);
    }
  }, []);

  useEffect(() => {
    if (
      !attemptedToLoadPhotosOnOpenRef.current &&
      endCursorRef.current === undefined &&
      !loadingPhotosRef.current
    ) {
      getMorePhotos();
      // we do this only once on open for avoiding to request permissions in rationale dialog again and again on
      // Android
      attemptedToLoadPhotosOnOpenRef.current = true;
    }
  }, [getMorePhotos]);

  const openSettings = useStableCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.log(error);
    }
  });

  return photoError ? (
    <AttachmentPickerGenericContent
      Icon={AttachmentMediaPickerIcon}
      onPress={openSettings}
      height={height}
      buttonText={t('Change in Settings')}
      description={t('You have not granted access to the photo library.')}
    />
  ) : (
    <BottomSheetFlatList
      contentContainerStyle={[styles.container, bottomSheetContentContainer]}
      data={photos}
      keyExtractor={keyExtractor}
      numColumns={numberOfColumns}
      onEndReached={photoError ? undefined : getMorePhotos}
      renderItem={renderAttachmentPickerItem}
      testID={'attachment-picker-list'}
      updateCellsBatchingPeriod={16}
    />
  );
};
