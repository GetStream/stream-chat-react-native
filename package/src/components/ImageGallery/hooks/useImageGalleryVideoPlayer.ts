import { useMemo } from 'react';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { VideoPlayerOptions } from '../../../state-store/video-player';

export type UseImageGalleryVideoPlayerProps = VideoPlayerOptions;

/**
 * Hook to get the video player instance.
 * @param options - The options for the video player.
 * @returns The video player instance.
 */
export const useImageGalleryVideoPlayer = (options: UseImageGalleryVideoPlayerProps) => {
  const { autoPlayVideo, imageGalleryStateStore } = useImageGalleryContext();
  const videoPlayer = useMemo(() => {
    return imageGalleryStateStore.videoPlayerPool.getOrAddPlayer({
      ...options,
      autoPlay: autoPlayVideo,
    });
  }, [autoPlayVideo, imageGalleryStateStore, options]);

  return videoPlayer;
};
