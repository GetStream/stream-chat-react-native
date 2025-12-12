import { Attachment, LocalMessage, StateStore, Unsubscribe } from 'stream-chat';

import { getGiphyMimeType } from '../components/Attachment/utils/getGiphyMimeType';
import { isVideoPlayerAvailable } from '../native';
import { FileTypes } from '../types/types';
import { getUrlOfImageAttachment } from '../utils/getUrlOfImageAttachment';

const isViewableImageAttachment = (attachment: Attachment) => {
  return attachment.type === FileTypes.Image && !attachment.title_link && !attachment.og_scrape_url;
};

const isViewableVideoAttachment = (attachment: Attachment) => {
  return attachment.type === FileTypes.Video && isVideoPlayerAvailable();
};

const isViewableGiphyAttachment = (attachment: Attachment) => {
  return attachment.type === FileTypes.Giphy;
};

const stripQueryFromUrl = (url: string) => url.split('?')[0];

export type ImageGalleryState = {
  message?: LocalMessage;
  selectedAttachmentUrl?: string;
  currentIndex: number;
};

const INITIAL_STATE: ImageGalleryState = {
  currentIndex: 0,
  message: undefined,
  selectedAttachmentUrl: undefined,
};

export type ImageGalleryOptions = {
  autoPlayVideo?: boolean;
  giphyVersion?: keyof NonNullable<Attachment['giphy']>;
};

const INITIAL_IMAGE_GALLERY_OPTIONS: ImageGalleryOptions = {
  autoPlayVideo: false,
  giphyVersion: 'fixed_height',
};

export class ImageGalleryStateStore {
  state: StateStore<ImageGalleryState>;
  private options: ImageGalleryOptions;

  constructor(options: Partial<ImageGalleryOptions>) {
    this.options = { ...INITIAL_IMAGE_GALLERY_OPTIONS, ...options };
    this.state = new StateStore<ImageGalleryState>(INITIAL_STATE);
  }

  // Getters
  get message() {
    return this.state.getLatestValue().message;
  }

  get selectedAttachmentUrl() {
    return this.state.getLatestValue().selectedAttachmentUrl;
  }

  get attachments() {
    const message = this.message;

    const attachments = message?.attachments ?? [];

    const filteredAttachments = attachments.filter((attachment) => {
      return (
        isViewableImageAttachment(attachment) ||
        isViewableVideoAttachment(attachment) ||
        isViewableGiphyAttachment(attachment)
      );
    });

    return filteredAttachments;
  }

  get assets() {
    const message = this.message;
    const attachments = this.attachments;
    const { giphyVersion = 'fixed_height', autoPlayVideo } = this.options;

    return attachments.map((attachment) => {
      const imageUrl = getUrlOfImageAttachment(attachment, giphyVersion) as string;
      const giphyURL =
        attachment.giphy?.[giphyVersion]?.url || attachment.thumb_url || attachment.image_url;
      const giphyMimeType = getGiphyMimeType(giphyURL ?? '');
      const initiallyPaused = !autoPlayVideo;

      return {
        channelId: message?.cid,
        created_at: message?.created_at,
        duration: 0,
        id: `photoId-${message?.id}-${imageUrl}`,
        messageId: message?.id,
        mime_type: attachment.type === 'giphy' ? giphyMimeType : attachment.mime_type,
        original_height: attachment.original_height,
        original_width: attachment.original_width,
        paused: initiallyPaused,
        progress: 0,
        thumb_url: attachment.thumb_url,
        type: attachment.type,
        uri: imageUrl,
        user: message?.user,
        user_id: message?.user_id,
      };
    });
  }

  // Setters
  set message(message: LocalMessage | undefined) {
    this.state.partialNext({ message });
  }

  set selectedAttachmentUrl(selectedAttachmentUrl: string | undefined) {
    this.state.partialNext({ selectedAttachmentUrl });
  }

  set currentIndex(currentIndex: number) {
    this.state.partialNext({ currentIndex });
  }

  subscribeToSelectedAttachmentUrl = () => {
    const unsubscribe = this.state.subscribeWithSelector(
      (currentValue) => ({
        message: currentValue.message,
        selectedAttachmentUrl: currentValue.selectedAttachmentUrl,
      }),
      ({ selectedAttachmentUrl, message }) => {
        if (!selectedAttachmentUrl || !message) {
          return;
        }
        const assets = this.assets;
        const index = assets.findIndex(
          (asset) =>
            asset.messageId === message?.id &&
            stripQueryFromUrl(asset.uri) === stripQueryFromUrl(selectedAttachmentUrl ?? ''),
        );
        console.log('index', index);
        this.state.partialNext({ currentIndex: index === -1 ? 0 : index });
      },
    );

    return unsubscribe;
  };

  registerSubscriptions = () => {
    const subscriptions: Unsubscribe[] = [];
    subscriptions.push(this.subscribeToSelectedAttachmentUrl());
    return () => {
      subscriptions.forEach((subscription) => subscription());
    };
  };

  clear = () => {
    this.state.partialNext(INITIAL_STATE);
  };
}
