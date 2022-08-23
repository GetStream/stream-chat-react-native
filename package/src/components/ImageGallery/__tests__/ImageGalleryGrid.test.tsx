import React from 'react';

import { Text, View } from 'react-native';
import { act } from 'react-test-renderer';

import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../contexts/translationContext/TranslationContext';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { ImageGrid, ImageGridType } from '../components/ImageGrid';

jest.mock('@gorhom/bottom-sheet', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const FlatList = require('react-native/Libraries/Lists/FlatList');
  return {
    BottomSheetFlatList: FlatList,
    TouchableOpacity: View,
  };
});

const getComponent = (props: Partial<ImageGridType> = {}) => {
  const t = jest.fn((key) => key);

  return (
    <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
      <ThemeProvider style={defaultTheme}>
        <ImageGrid {...(props as unknown as ImageGridType)} />
      </ThemeProvider>
    </TranslationProvider>
  );
};

describe('ImageGalleryOverlay', () => {
  it('should render ImageGalleryGrid', () => {
    const { queryAllByA11yLabel } = render(
      getComponent({ photos: [generateImageAttachment(), generateImageAttachment()] }),
    );

    expect(queryAllByA11yLabel('Image Grid')).toHaveLength(1);
  });

  it('should render ImageGalleryGrid individual images', () => {
    const { queryAllByA11yLabel } = render(
      getComponent({
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
      }),
    );

    expect(queryAllByA11yLabel('Grid Image')).toHaveLength(2);
  });

  it('should render ImageGalleryGrid with custom image component', () => {
    const CustomImageComponent = () => (
      <View>
        <Text>Image Attachment</Text>
      </View>
    );

    const { queryAllByText } = render(
      getComponent({
        imageComponent: CustomImageComponent,
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
      }),
    );

    expect(queryAllByText('Image Attachment')).toHaveLength(2);
  });

  it('should trigger the selectAndClose when the Image item is pressed', () => {
    const closeGridViewMock = jest.fn();
    const setSelectedMessageMock = jest.fn();

    const { getAllByA11yLabel } = render(
      getComponent({
        closeGridView: closeGridViewMock,
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
        setSelectedMessage: setSelectedMessageMock,
      }),
    );

    const component = getAllByA11yLabel('Grid Image');

    act(() => {
      fireEvent(component[0], 'onPress');
    });

    expect(closeGridViewMock).toHaveBeenCalledTimes(1);
    expect(setSelectedMessageMock).toHaveBeenCalledTimes(1);
  });
});
