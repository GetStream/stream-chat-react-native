import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { renderAttachmentPickerItem } from './AttachmentPickerItem';

import { IOS_LIMITED_DEEPLINK, type PhotoContentItemType } from './shared';

import { useAttachmentPickerContext, useTheme, useTranslationContext } from '../../../../contexts';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';

import { useStableCallback } from '../../../../hooks';

import { NativeHandlers } from '../../../../native';
import { BottomSheetFlatList } from '../../../BottomSheetCompatibility/BottomSheetFlatList';
import {
  AttachmentPickerGenericContent,
  type AttachmentPickerContentProps,
} from '../AttachmentPickerGenericContent';

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
  const { icons } = useComponentsContext();

  return <icons.Picture height={22} stroke={semantics.textTertiary} width={22} />;
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
    // iOS 14 fires this when the user changes which photos the app is permitted to read.
    const { unsubscribe } = NativeHandlers.oniOS14GalleryLibrarySelectionChange(() => {
      // Restart pagination from the first page.
      hasNextPageRef.current = true;
      endCursorRef.current = undefined;
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
      // Once per open, so Android does not show the permission rationale dialog repeatedly.
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
      buttonText={t('attachmentPicker.openSettings.label', 'Change in Settings')}
      description={t(
        'attachmentPicker.photoLibrary.denied.description',
        'You have not granted access to the photo library.',
      )}
    />
  ) : (
    <BottomSheetFlatList
      contentContainerStyle={[styles.container, bottomSheetContentContainer]}
      data={photos}
      keyExtractor={keyExtractor}
      key={numberOfColumns}
      numColumns={numberOfColumns}
      onEndReached={photoError ? undefined : getMorePhotos}
      renderItem={renderAttachmentPickerItem}
      showsVerticalScrollIndicator={false}
      testID={'attachment-picker-list'}
      updateCellsBatchingPeriod={16}
    />
  );
};
