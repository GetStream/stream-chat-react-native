import { useMemo } from 'react';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContextBase';
import { VideoPlayerOptions } from '../../../state-store/video-player';

export type UseImageGalleryVideoPlayerProps = VideoPlayerOptions;

/**
 * Gets the video player from the gallery's pool, creating it when missing.
 *
 * @param options Video player options. `options.id` identifies the player in the pool.
 * @returns The video player instance.
 */
export const useImageGalleryVideoPlayer = (options: UseImageGalleryVideoPlayerProps) => {
  const { imageGalleryStateStore } = useImageGalleryContext();
  const videoPlayer = useMemo(
    () => imageGalleryStateStore.videoPlayerPool.getOrAddPlayer(options),
    [imageGalleryStateStore, options],
  );

  return videoPlayer;
};
