import React from 'react';

import { Text, View } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

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

const getComponent = (props: Partial<ImageGridType> = {}) => {
  const t = jest.fn((key) => key);

  return (
    <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
      <ThemeProvider theme={defaultTheme}>
        <ImageGrid {...(props as unknown as ImageGridType)} />
      </ThemeProvider>
    </TranslationProvider>
  );
};

describe('ImageGalleryOverlay', () => {
  it('should render ImageGalleryGrid', () => {
    render(getComponent({ photos: [generateImageAttachment(), generateImageAttachment()] }));

    expect(screen.queryAllByLabelText('Image Grid')).toHaveLength(1);
  });

  it('should render ImageGalleryGrid individual images', () => {
    render(
      getComponent({
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
      }),
    );

    expect(screen.queryAllByLabelText('Grid Image')).toHaveLength(2);
  });

  it('should render ImageGalleryGrid with custom image component', () => {
    const CustomImageComponent = () => (
      <View>
        <Text>Image Attachment</Text>
      </View>
    );

    render(
      getComponent({
        imageComponent: CustomImageComponent,
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
      }),
    );

    expect(screen.queryAllByText('Image Attachment')).toHaveLength(2);
  });

  it('should trigger the selectAndClose when the Image item is pressed', () => {
    const closeGridViewMock = jest.fn();
    const setSelectedMessageMock = jest.fn();

    render(
      getComponent({
        closeGridView: closeGridViewMock,
        photos: [generateImageAttachment(), generateVideoAttachment({ type: 'video' })],
        setSelectedMessage: setSelectedMessageMock,
      }),
    );

    const component = screen.getAllByLabelText('Grid Image');

    act(() => {
      fireEvent(component[0], 'onPress');
    });

    expect(closeGridViewMock).toHaveBeenCalledTimes(1);
    expect(setSelectedMessageMock).toHaveBeenCalledTimes(1);
  });
});
