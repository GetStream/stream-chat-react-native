export const forbiddenWord = 'wth';

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

export enum ReactionType {
  LOVE = 'love',
  LOL = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  LIKE = 'like',
}

export enum MessageDeliveryStatus {
  READ = 'read',
  DELIVERED = 'delivered',
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  /** No delivery status icon is expected. */
  NIL = 'nil',
}
