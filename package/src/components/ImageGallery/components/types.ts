import type { SharedValue } from 'react-native-reanimated';

export type ImageGalleryVideoControlProps = {
  attachmentId: string;
};

export type ImageGalleryHeaderProps = {
  opacity: SharedValue<number>;
  visible: SharedValue<number>;
};

export type ImageGalleryFooterProps = {
  accessibilityLabel: string;
  opacity: SharedValue<number>;
  openGridView: () => void;
  visible: SharedValue<number>;
};

export type ImageGalleryGridProps = {
  closeGridView: () => void;
  numberOfImageGalleryGridColumns?: number;
};
