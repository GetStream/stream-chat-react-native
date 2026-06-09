import React, { useEffect } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { ImageGalleryStateStore } from '../../../state-store/image-gallery-state-store';
import { ImageGallery } from '../ImageGallery';

jest.mock('../../../native.ts', () => {
  const { View } = require('react-native');
  return {
    isFileSystemAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isShareImageAvailable: jest.fn(() => true),
    isVideoPlayerAvailable: jest.fn(() => true),
    NativeHandlers: { Video: View },
  };
});

type HarnessProps = {
  message: LocalMessage;
  accessibilityEnabled?: boolean;
  store: ImageGalleryStateStore;
};

const Harness = ({ accessibilityEnabled = true, message, store }: HarnessProps) => {
  useEffect(() => {
    const unsubscribe = store.registerSubscriptions();
    return () => unsubscribe();
  }, [store]);

  const { attachments } = message;
  store.openImageGallery({
    messages: [message],
    selectedAttachmentUrl: attachments?.[0]?.asset_url || attachments?.[0]?.image_url || '',
  });

  return (
    <OverlayProvider
      accessibility={{ enabled: accessibilityEnabled }}
      value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}
    >
      <ImageGalleryContext.Provider
        value={{ imageGalleryStateStore: store } as unknown as ImageGalleryContextValue}
      >
        <ImageGallery />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

const findGalleryRoot = () =>
  screen.getByLabelText('Image Gallery', { includeHiddenElements: true });

const fireAccessibilityAction = (actionName: 'increment' | 'decrement') => {
  fireEvent(findGalleryRoot(), 'accessibilityAction', { nativeEvent: { actionName } });
};

const renderWithAssets = (assetsCount: number, accessibilityEnabled = true) => {
  const attachments = [
    ...Array.from({ length: Math.max(assetsCount - 1, 0) }, () => generateImageAttachment()),
    ...(assetsCount > 0 ? [generateVideoAttachment({ type: 'video' })] : []),
  ];
  const message = generateMessage({ attachments });
  const store = new ImageGalleryStateStore();
  render(<Harness accessibilityEnabled={accessibilityEnabled} message={message} store={store} />);
  return { store };
};

describe('ImageGallery adjustable cycling', () => {
  it('marks the root as adjustable with the position value when a11y is enabled and there is more than one asset', async () => {
    renderWithAssets(3);

    await waitFor(() => {
      const root = findGalleryRoot();
      expect(root.props.accessibilityRole).toBe('adjustable');
      expect(root.props.accessibilityValue).toEqual({ text: '1 of 3' });
      expect(root.props.accessibilityActions).toEqual([
        { name: 'increment' },
        { name: 'decrement' },
      ]);
    });
  });

  it('does not apply the adjustable role when accessibility is disabled', async () => {
    renderWithAssets(3, false);

    await waitFor(() => {
      const root = findGalleryRoot();
      expect(root.props.accessibilityRole).toBeUndefined();
      expect(root.props.accessibilityActions).toBeUndefined();
    });
  });

  it('moves to the next asset on increment and clamps at the last asset', async () => {
    const { store } = renderWithAssets(3);

    await waitFor(() => expect(findGalleryRoot().props.accessibilityRole).toBe('adjustable'));

    act(() => fireAccessibilityAction('increment'));
    expect(store.state.getLatestValue().currentIndex).toBe(1);

    act(() => fireAccessibilityAction('increment'));
    expect(store.state.getLatestValue().currentIndex).toBe(2);

    act(() => fireAccessibilityAction('increment'));
    expect(store.state.getLatestValue().currentIndex).toBe(2);
  });

  it('moves to the previous asset on decrement and clamps at the first asset', async () => {
    const { store } = renderWithAssets(3);

    await waitFor(() => expect(findGalleryRoot().props.accessibilityRole).toBe('adjustable'));

    act(() => fireAccessibilityAction('increment'));
    act(() => fireAccessibilityAction('increment'));
    expect(store.state.getLatestValue().currentIndex).toBe(2);

    act(() => fireAccessibilityAction('decrement'));
    expect(store.state.getLatestValue().currentIndex).toBe(1);

    act(() => fireAccessibilityAction('decrement'));
    expect(store.state.getLatestValue().currentIndex).toBe(0);

    act(() => fireAccessibilityAction('decrement'));
    expect(store.state.getLatestValue().currentIndex).toBe(0);
  });
});
