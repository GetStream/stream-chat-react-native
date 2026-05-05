import React from 'react';
import { ImageProps, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { VideoThumbnail } from '../VideoThumbnail';

const CustomImageComponent = (props: ImageProps) => (
  <View accessibilityLabel={props.accessibilityLabel} testID='custom-image-component' />
);

const renderVideoThumbnail = (thumb_url: string) =>
  render(
    <ThemeProvider>
      <WithComponents overrides={{ ImageComponent: CustomImageComponent }}>
        <VideoThumbnail thumb_url={thumb_url} />
      </WithComponents>
    </ThemeProvider>,
  );

describe('VideoThumbnail', () => {
  it('uses the configured ImageComponent for remote thumbnail URLs', () => {
    renderVideoThumbnail('https://example.com/video-thumbnail.jpg');

    expect(screen.getByTestId('custom-image-component')).toBeTruthy();
  });

  it('uses the default Image fallback for local thumbnail paths', () => {
    renderVideoThumbnail('file:///tmp/video-thumbnail.jpg');

    expect(screen.queryByTestId('custom-image-component')).toBeNull();
    expect(screen.getByLabelText('Video Thumbnail')).toBeTruthy();
  });

  it('renders the image loading indicator while the thumbnail is loading', () => {
    renderVideoThumbnail('file:///tmp/video-thumbnail.jpg');

    fireEvent(screen.getByLabelText('Video Thumbnail'), 'loadStart');

    expect(screen.getByLabelText('Image Loading Indicator')).toBeTruthy();
  });
});
