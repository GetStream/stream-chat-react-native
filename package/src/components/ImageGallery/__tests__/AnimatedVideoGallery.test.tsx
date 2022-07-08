import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { fireEvent, render } from '@testing-library/react-native';

import { Chat } from '../../../components/Chat/Chat';
import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { generateVideoAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';
import { ImageGallery } from '../ImageGallery';
import { AnimatedGalleryVideo } from '../components/AnimatedGalleryVideo';
import { act } from 'react-test-renderer';

jest.mock('../../../native.ts', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    isVideoPackageAvailable: jest.fn(() => true),
    NetInfo: {
      addEventListener: jest.fn(),
    },
    Video: View,
  };
});

describe('ImageGallery', () => {
  it('render image gallery component with video rendered', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { queryAllByA11yLabel } = render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              images: [
                generateMessage({
                  attachments: [generateVideoAttachment({ type: 'video' })],
                }),
              ] as unknown as MessageType<DefaultStreamChatGenerics>[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );
    expect(queryAllByA11yLabel('image-gallery-video')).toHaveLength(1);
  });

  it('render empty view when shouldRender is false', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { getByA11yLabel } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={false}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    expect(getByA11yLabel('empty-view-image-gallery')).not.toBeUndefined();
  });

  it('trigger onEnd and onProgress events handlers of Video component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const handleEndMock = jest.fn();
    const handleProgressMock = jest.fn();

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          handleEnd={handleEndMock}
          handleProgress={handleProgressMock}
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={true}
          source={{
            uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    const videoComponent = getByTestId('video-player');

    act(() => {
      fireEvent(videoComponent, 'onEnd');
      fireEvent(videoComponent, 'onProgress');
    });

    expect(handleEndMock).toHaveBeenCalled();
    expect(handleProgressMock).toHaveBeenCalled();
  });

  it('trigger onLoadStart event handler of Video component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { getByTestId, queryByA11yLabel } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={true}
          source={{
            uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    const videoComponent = getByTestId('video-player');
    const spinnerComponent = queryByA11yLabel('spinner');

    act(() => {
      fireEvent(videoComponent, 'onLoadStart');
    });
    expect(spinnerComponent?.props.style.opacity).toBe(1);
  });

  it('trigger onLoad event handler of Video component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const handleLoadMock = jest.fn();

    const { getByTestId, queryByA11yLabel } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          handleLoad={handleLoadMock}
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={true}
          source={{
            uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    const videoComponent = getByTestId('video-player');
    const spinnerComponent = queryByA11yLabel('spinner');

    act(() => {
      fireEvent(videoComponent, 'onLoad');
    });

    expect(handleLoadMock).toHaveBeenCalled();
    expect(spinnerComponent?.props.style.opacity).toBe(0);
  });

  it('trigger onBuffer event handler of Video component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { getByTestId, queryByA11yLabel } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={true}
          source={{
            uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    const videoComponent = getByTestId('video-player');
    const spinnerComponent = queryByA11yLabel('spinner');

    act(() => {
      fireEvent(videoComponent, 'onBuffer', {
        isBuffering: false,
      });
    });

    expect(spinnerComponent?.props.style.opacity).toBe(0);

    act(() => {
      fireEvent(videoComponent, 'onBuffer', {
        isBuffering: true,
      });
    });

    expect(spinnerComponent?.props.style.opacity).toBe(1);
  });

  it('trigger onPlaybackStatusUpdate event handler of Video component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    jest.spyOn(console, 'error');
    const handleLoadMock = jest.fn();
    const handleProgressMock = jest.fn();
    const handleEndMock = jest.fn();

    const { getByTestId, queryByA11yLabel } = render(
      <Chat client={chatClient}>
        <AnimatedGalleryVideo
          handleEnd={handleEndMock}
          handleLoad={handleLoadMock}
          handleProgress={handleProgressMock}
          offsetScale={{ value: 1 } as SharedValue<number>}
          scale={{ value: 1 } as SharedValue<number>}
          shouldRender={true}
          source={{
            uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          translateX={{ value: 1 } as SharedValue<number>}
        />
      </Chat>,
    );

    const videoComponent = getByTestId('video-player');
    const spinnerComponent = queryByA11yLabel('spinner');

    act(() => {
      fireEvent(videoComponent, 'onPlaybackStatusUpdate', {
        error: true,
        isLoaded: false,
      });
    });

    expect(spinnerComponent?.props.style.opacity).toBe(1);
    expect(console.error).toHaveBeenCalled();

    act(() => {
      fireEvent(videoComponent, 'onPlaybackStatusUpdate', {
        isLoaded: true,
      });
    });

    expect(spinnerComponent?.props.style.opacity).toBe(0);
    expect(handleLoadMock).toHaveBeenCalled();

    act(() => {
      fireEvent(videoComponent, 'onPlaybackStatusUpdate', {
        isLoaded: true,
        isPlaying: true,
      });
    });

    expect(handleProgressMock).toHaveBeenCalled();

    act(() => {
      fireEvent(videoComponent, 'onPlaybackStatusUpdate', {
        isBuffering: true,
        isLoaded: true,
      });
    });

    expect(spinnerComponent?.props.style.opacity).toBe(1);

    act(() => {
      fireEvent(videoComponent, 'onPlaybackStatusUpdate', {
        didJustFinish: true,
        isLoaded: true,
        isLooping: false,
      });
    });

    expect(handleEndMock).toHaveBeenCalled();
  });
});
