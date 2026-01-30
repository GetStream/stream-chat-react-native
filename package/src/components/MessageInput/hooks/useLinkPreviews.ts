import { LinkPreviewsManager, LinkPreviewsManagerState } from 'stream-chat';

import { useMessageComposer } from '../../../contexts';
import { useStateStore } from '../../../hooks';

const linkPreviewsManagerStateSelector = (state: LinkPreviewsManagerState) => ({
  linkPreviews: Array.from(state.previews.values()).filter((preview) =>
    LinkPreviewsManager.previewIsLoaded(preview),
  ),
});

export const useLinkPreviews = () => {
  const messageComposer = useMessageComposer();
  const { linkPreviewsManager } = messageComposer;
  const { linkPreviews } = useStateStore(
    linkPreviewsManager.state,
    linkPreviewsManagerStateSelector,
  );

  return linkPreviews;
};

export const useHasLinkPreviews = () => {
  const linkPreviews = useLinkPreviews();

  return linkPreviews.length > 0;
};
