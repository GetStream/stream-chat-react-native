import React from 'react';

import { Text, View } from 'react-native';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../contexts/translationContext/TranslationContext';
import {
  ImageGalleryGridHandleCustomComponentProps,
  ImageGridHandle,
} from '../components/ImageGridHandle';

type ImageGridHandleProps = ImageGalleryGridHandleCustomComponentProps & {
  closeGridView: () => void;
};

jest.mock('@gorhom/bottom-sheet', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    TouchableOpacity: View,
  };
});

const getComponent = (props: Partial<ImageGridHandleProps> = {}) => {
  const t = jest.fn((key) => key);

  return (
    <TranslationProvider value={{ t } as unknown as TranslationContextValue}>
      <ThemeProvider style={defaultTheme}>
        <ImageGridHandle {...(props as unknown as ImageGridHandleProps)} />
      </ThemeProvider>
    </TranslationProvider>
  );
};

describe('ImageGalleryOverlay', () => {
  it('should render ImageGalleryGridHandle', () => {
    const { queryAllByA11yLabel } = render(getComponent());

    expect(queryAllByA11yLabel('Image Grid Handle')).toHaveLength(1);
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

    const { queryAllByText } = render(
      getComponent({
        centerComponent: CustomCenterComponent,
        leftComponent: CustomLeftComponent,
        rightComponent: CustomRightComponent,
      }),
    );

    expect(queryAllByText('Left Element')).toHaveLength(1);
    expect(queryAllByText('Right Element')).toHaveLength(1);
    expect(queryAllByText('Center Element')).toHaveLength(1);
  });
});
