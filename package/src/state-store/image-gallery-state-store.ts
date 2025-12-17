import { Attachment, LocalMessage, StateStore, Unsubscribe, UserResponse } from 'stream-chat';

import { VideoPlayerPool } from './video-player-pool';

import { getGiphyMimeType } from '../components/Attachment/utils/getGiphyMimeType';
import { isVideoPlayerAvailable } from '../native';
import { FileTypes } from '../types/types';
import { getUrlOfImageAttachment } from '../utils/getUrlOfImageAttachment';

export type ImageGalleryAsset = {
  id: string;
  index: number;
  uri: string;
  channelId?: string;
  created_at?: string | Date;
  messageId?: string;
  mime_type?: string;
  original_height?: number;
  original_width?: number;
  thumb_url?: string;
  type?: string;
  user?: UserResponse | null;
  user_id?: string;
};

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
  assets: ImageGalleryAsset[];
  messages: LocalMessage[];
  selectedAttachmentUrl?: string;
  currentIndex: number;
};

const INITIAL_STATE: ImageGalleryState = {
  assets: [],
  currentIndex: 0,
  messages: [],
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
  options: ImageGalleryOptions;
  videoPlayerPool: VideoPlayerPool;

  constructor(options: Partial<ImageGalleryOptions> = {}) {
    this.options = { ...INITIAL_IMAGE_GALLERY_OPTIONS, ...options };
    this.state = new StateStore<ImageGalleryState>(INITIAL_STATE);
    this.videoPlayerPool = new VideoPlayerPool();
  }

  // Getters
  get messages() {
    return this.state.getLatestValue().messages;
  }

  get selectedAttachmentUrl() {
    return this.state.getLatestValue().selectedAttachmentUrl;
  }

  get attachmentsWithMessage() {
    const messages = this.messages;

    const attachmentsWithMessage = messages
      .map((message) => ({
        attachments: message.attachments ?? [],
        message,
      }))
      .filter(({ attachments }) =>
        attachments.some((attachment) => {
          if (!attachment) {
            return false;
          }
          return (
            isViewableImageAttachment(attachment) ||
            isViewableVideoAttachment(attachment) ||
            isViewableGiphyAttachment(attachment)
          );
        }),
      );

    return attachmentsWithMessage;
  }

  getAssetId(messageId: string, assetUrl: string) {
    return `photoId-${messageId}-${assetUrl}`;
  }

  get assets() {
    const attachmentsWithMessage = this.attachmentsWithMessage;
    const { giphyVersion = 'fixed_height' } = this.options;

    return attachmentsWithMessage.flatMap(({ message, attachments }, index) => {
      return attachments.map((attachment) => {
        const assetUrl = getUrlOfImageAttachment(attachment, giphyVersion) as string;
        const assetId = this.getAssetId(message?.id ?? '', assetUrl);
        const giphyURL =
          attachment.giphy?.[giphyVersion]?.url || attachment.thumb_url || attachment.image_url;
        const giphyMimeType = getGiphyMimeType(giphyURL ?? '');

        return {
          channelId: message?.cid,
          created_at: message?.created_at,
          id: assetId,
          index,
          messageId: message?.id,
          mime_type: attachment.type === 'giphy' ? giphyMimeType : attachment.mime_type,
          original_height: attachment.original_height,
          original_width: attachment.original_width,
          thumb_url: attachment.thumb_url,
          type: attachment.type,
          uri: assetUrl,
          user: message?.user,
          user_id: message?.user_id,
        };
      });
    });
  }

  // Setters
  set messages(messages: LocalMessage[]) {
    this.state.partialNext({ messages });
  }

  set selectedAttachmentUrl(selectedAttachmentUrl: string | undefined) {
    this.state.partialNext({ selectedAttachmentUrl });
  }

  set currentIndex(currentIndex: number) {
    this.state.partialNext({ currentIndex });
  }

  // APIs for managing messages
  appendMessages = (messages: LocalMessage[]) => {
    this.state.partialNext({ messages: [...this.messages, ...messages] });
  };

  removeMessages = (messages: LocalMessage[]) => {
    this.state.partialNext({
      messages: this.messages.filter((message) => !messages.includes(message)),
    });
  };

  openImageGallery = ({
    messages,
    selectedAttachmentUrl,
  }: {
    messages: LocalMessage[];
    selectedAttachmentUrl?: string;
  }) => {
    this.state.partialNext({ messages, selectedAttachmentUrl });
  };

  subscribeToMessages = () => {
    const unsubscribe = this.state.subscribeWithSelector(
      (currentValue) => ({
        messages: currentValue.messages,
      }),
      () => {
        const assets = this.assets;
        this.state.partialNext({ assets });
      },
    );

    return unsubscribe;
  };

  subscribeToSelectedAttachmentUrl = () => {
    const unsubscribe = this.state.subscribeWithSelector(
      (currentValue) => ({
        messages: currentValue.messages,
        selectedAttachmentUrl: currentValue.selectedAttachmentUrl,
      }),
      ({ selectedAttachmentUrl }) => {
        if (!selectedAttachmentUrl) {
          return;
        }
        const index = this.assets.findIndex(
          (asset) =>
            stripQueryFromUrl(asset.uri) === stripQueryFromUrl(selectedAttachmentUrl ?? ''),
        );
        this.state.partialNext({ currentIndex: index === -1 ? 0 : index });
      },
    );

    return unsubscribe;
  };

  registerSubscriptions = () => {
    const subscriptions: Unsubscribe[] = [];
    subscriptions.push(this.subscribeToMessages());
    subscriptions.push(this.subscribeToSelectedAttachmentUrl());

    return () => {
      subscriptions.forEach((subscription) => subscription());
      this.videoPlayerPool.clear();
    };
  };

  clear = () => {
    this.state.partialNext(INITIAL_STATE);
    this.videoPlayerPool.clear();
  };
}
