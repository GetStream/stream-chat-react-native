import React from 'react';

import { Text, View } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import {
  ImageGalleryGridHandleCustomComponentProps,
  ImageGridHandle,
} from '../components/ImageGridHandle';

type ImageGridHandleProps = ImageGalleryGridHandleCustomComponentProps & {
  closeGridView: () => void;
};

const getComponent = (props: Partial<ImageGridHandleProps> = {}) => {
  return (
    <ThemeProvider theme={defaultTheme}>
      <ImageGridHandle {...(props as unknown as ImageGridHandleProps)} />
    </ThemeProvider>
  );
};

describe('ImageGalleryOverlay', () => {
  it('should render ImageGalleryGridHandle', () => {
    render(getComponent());

    expect(screen.queryAllByLabelText('Image Grid Handle')).toHaveLength(1);
  });

  it('should render the custom components', () => {
    const CustomLeftComponent = () => (
      <View>
        <Text>Left Element</Text>
      </View>
    );

    const CustomRightComponent = () => (
      <View>
        <Text>Right Element</Text>
      </View>
    );

    const CustomCenterComponent = () => (
      <View>
        <Text>Center Element</Text>
      </View>
    );

    render(
      getComponent({
        centerComponent: CustomCenterComponent,
        leftComponent: CustomLeftComponent,
        rightComponent: CustomRightComponent,
      }),
    );

    expect(screen.queryAllByText('Left Element')).toHaveLength(1);
    expect(screen.queryAllByText('Right Element')).toHaveLength(1);
    expect(screen.queryAllByText('Center Element')).toHaveLength(1);
  });
});
