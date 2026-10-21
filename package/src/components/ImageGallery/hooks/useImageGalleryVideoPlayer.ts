import { useMemo } from 'react';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContextBase';
import { VideoPlayerOptions } from '../../../state-store/video-player';

export type UseImageGalleryVideoPlayerProps = VideoPlayerOptions;

/**
 * Gets the video player from the gallery's pool, creating it when missing. `autoPlay` comes from
 * the gallery context.
 *
 * @param options Video player options. `options.id` identifies the player in the pool.
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
