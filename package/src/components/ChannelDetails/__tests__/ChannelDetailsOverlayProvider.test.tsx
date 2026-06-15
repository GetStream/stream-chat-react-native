import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import { ImageGalleryProvider } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContextBase';
import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import {
  TranslationProvider,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { ChannelDetailsOverlayProvider } from '../components/modal/ChannelDetailsOverlayProvider';

// Render a lightweight stand-in for the gallery so we don't need its full machinery.
jest.mock('../../ImageGallery/ImageGallery', () => {
  const ReactLib = require('react');
  const { Text: RNText } = require('react-native');
  return {
    ImageGallery: () => ReactLib.createElement(RNText, { testID: 'image-gallery' }, 'gallery'),
  };
});

type Captured = {
  autoPlayVideo?: boolean;
  giphyVersion?: string;
  numberOfImageGalleryGridColumns?: number;
  store?: unknown;
  t?: (key: string) => string;
};

let captured: Captured;

const Probe = () => {
  const { autoPlayVideo, giphyVersion, imageGalleryStateStore, numberOfImageGalleryGridColumns } =
    useImageGalleryContext();
  const { setOverlay } = useOverlayContext();
  const { t } = useTranslationContext();
  captured = {
    autoPlayVideo,
    giphyVersion,
    numberOfImageGalleryGridColumns,
    store: imageGalleryStateStore,
    t,
  };
  return (
    <Text onPress={() => setOverlay('gallery')} testID='open-gallery'>
      {t('probe-key')}
    </Text>
  );
};

describe('ChannelDetailsOverlayProvider', () => {
  beforeEach(() => {
    captured = {};
  });

  it('inherits the surrounding TranslationContext instead of re-creating it (no i18n reset)', () => {
    const parentT = jest.fn((key: string) => `translated:${key}`);

    const { getByTestId } = render(
      <TranslationProvider
        value={{
          t: parentT as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'de',
        }}
      >
        <ChannelDetailsOverlayProvider>
          <Probe />
        </ChannelDetailsOverlayProvider>
      </TranslationProvider>,
    );

    // The child received the SAME translator the parent provided — proving the provider did not
    // wrap a fresh TranslationProvider (which would reset to English defaults).
    expect(captured.t).toBe(parentT);
    expect(getByTestId('open-gallery')).toHaveTextContent('translated:probe-key');
  });

  it('provides a modal-local overlay that renders the gallery when set to "gallery"', () => {
    const { getByTestId, queryByTestId } = render(
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsOverlayProvider>
          <Probe />
        </ChannelDetailsOverlayProvider>
      </TranslationProvider>,
    );

    expect(queryByTestId('image-gallery')).toBeNull();

    fireEvent.press(getByTestId('open-gallery'));

    expect(getByTestId('image-gallery')).toBeTruthy();
  });

  it('inherits image gallery config from the root provider but exposes a modal-local store', () => {
    let rootStore: unknown;
    const RootProbe = () => {
      rootStore = useImageGalleryContext().imageGalleryStateStore;
      return null;
    };

    render(
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ImageGalleryProvider
          value={{
            autoPlayVideo: true,
            giphyVersion: 'fixed_width',
            numberOfImageGalleryGridColumns: 4,
          }}
        >
          <RootProbe />
          <ChannelDetailsOverlayProvider>
            <Probe />
          </ChannelDetailsOverlayProvider>
        </ImageGalleryProvider>
      </TranslationProvider>,
    );

    // Config flows down from the root provider...
    expect(captured.autoPlayVideo).toBe(true);
    expect(captured.giphyVersion).toBe('fixed_width');
    expect(captured.numberOfImageGalleryGridColumns).toBe(4);
    // ...but the gallery store is a distinct, modal-local instance.
    expect(captured.store).toBeDefined();
    expect(captured.store).not.toBe(rootStore);
  });
});
