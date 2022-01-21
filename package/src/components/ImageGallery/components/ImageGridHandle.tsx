import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TouchableOpacity } from '@gorhom/bottom-sheet';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Close } from '../../../icons';

const styles = StyleSheet.create({
  closeButton: {
    marginRight: 16,
  },
  handle: {
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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

export const ImageGridHandle: React.FC<Props> = (props) => {
  const { centerComponent, closeGridView, leftComponent, rightComponent } = props;
  const {
    theme: {
      colors: { black, white },
      imageGallery: {
        grid: { handle, handleText },
      },
    },
  } = useTheme('ImageGridHandle');
  const { t } = useTranslationContext('ImageGridHandle');

  return (
    <View style={[styles.handle, { backgroundColor: white }, handle]}>
      {leftComponent ? leftComponent({ closeGridView }) : <View style={styles.leftContainer} />}
      {centerComponent ? (
        centerComponent({ closeGridView })
      ) : (
        <Text style={[styles.text, { color: black }, handleText]}>{t('Photos')}</Text>
      )}
      {rightComponent ? (
        rightComponent({ closeGridView })
      ) : (
        <TouchableOpacity onPress={closeGridView}>
          <Close style={styles.closeButton} />
        </TouchableOpacity>
      )}
    </View>
  );
};

ImageGridHandle.displayName = 'ImageGridHandle{imageGallery{grid{handle}}}';
