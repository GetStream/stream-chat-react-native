import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Close } from '../../../icons';
import { BottomSheetTouchableOpacity } from '../../BottomSheetCompatibility/BottomSheetTouchableOpacity';

const styles = StyleSheet.create({
  closeButton: {
    marginRight: 16,
  },
  handle: {
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
  },
  leftContainer: {
    marginLeft: 16,
    width: 24, // Close icon width on right
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export type ImageGalleryGridHandleCustomComponent = ({
  closeGridView,
}: {
  closeGridView: () => void;
}) => React.ReactElement | null;

export type ImageGalleryGridHandleCustomComponentProps = {
  centerComponent?: ImageGalleryGridHandleCustomComponent;
  leftComponent?: ImageGalleryGridHandleCustomComponent;
  rightComponent?: ImageGalleryGridHandleCustomComponent;
};

type Props = ImageGalleryGridHandleCustomComponentProps & {
  closeGridView: () => void;
};

export const ImageGridHandle = (props: Props) => {
  const { centerComponent, closeGridView, leftComponent, rightComponent } = props;
  const {
    theme: {
      colors: { black, white },
      imageGallery: {
        grid: { handle, handleText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View
      accessibilityLabel='Image Grid Handle'
      style={[styles.handle, { backgroundColor: white }, handle]}
    >
      {leftComponent ? leftComponent({ closeGridView }) : <View style={styles.leftContainer} />}
      {centerComponent ? (
        centerComponent({ closeGridView })
      ) : (
        <Text style={[styles.text, { color: black }, handleText]}>{t('Photos and Videos')}</Text>
      )}
      {rightComponent ? (
        rightComponent({ closeGridView })
      ) : (
        <BottomSheetTouchableOpacity onPress={closeGridView}>
          <Close style={styles.closeButton} />
        </BottomSheetTouchableOpacity>
      )}
    </View>
  );
};

ImageGridHandle.displayName = 'ImageGridHandle{imageGallery{grid{handle}}}';
