import React, { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { getPhotos } from '../../native';
import { vh, vw } from '../../utils/utils';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
});

export type AttachmentPickerProps = {
  topInset?: number;
};

export const AttachmentPicker = React.forwardRef(
  (props: AttachmentPickerProps, ref: React.ForwardedRef<BottomSheet>) => {
    const { topInset } = props;
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [endCursor, setEndCursor] = useState<string>();
    const [photos, setPhotos] = useState<string[]>([]);

    const getMorePhotos = async () => {
      if (hasNextPage && !loadingPhotos) {
        setLoadingPhotos(true);
        try {
          const results = await getPhotos({ after: endCursor, first: 60 });
          setEndCursor(results.endCursor);
          setHasNextPage(results.hasNextPage || false);
          setPhotos([...photos, ...results.assets]);
        } catch (error) {
          console.log(error);
        }
        setLoadingPhotos(false);
      }
    };

    useEffect(() => {
      getMorePhotos();
    }, []);

    return (
      <BottomSheet
        initialSnapIndex={0}
        ref={ref}
        snapPoints={[200, vh(90)]}
        topInset={topInset}
      >
        <BottomSheetFlatList
          contentContainerStyle={styles.container}
          data={photos}
          numColumns={3}
          onEndReached={getMorePhotos}
          renderItem={(item) => (
            <Image
              key={item.item}
              source={{ uri: item.item }}
              style={{
                height: vw(100) / 3 - 2,
                margin: 1,
                width: vw(100) / 3 - 2,
              }}
            />
          )}
        />
      </BottomSheet>
    );
  },
);

AttachmentPicker.displayName = 'AttachmentPicker';
