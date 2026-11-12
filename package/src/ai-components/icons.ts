import { type ComponentType, useMemo } from 'react';

import { useTheme } from './contexts/theme-context';
import {
  ArchiveIcon,
  ArrowDownIcon,
  AudioIcon,
  CancelledIcon,
  CheckIcon,
  ChevronIcon,
  CopiedIcon,
  CopyIcon,
  DeviceIcon,
  EditIcon,
  FailedIcon,
  FileIcon,
  HandRaisedIcon,
  ImageIcon,
  InfoIcon,
  KeyIcon,
  PdfIcon,
  ReasoningIcon,
  RegenerateIcon,
  ShareIcon,
  ThumbsDownFilledIcon,
  ThumbsDownIcon,
  ThumbsUpFilledIcon,
  ThumbsUpIcon,
  VideoIcon,
} from './internal/icons/AgentIcons';

/**
 * What an icon of the agent replies' views is drawn with. An icon is decorative (the text or
 * label beside it says what it means), so one of your own hides itself from screen readers, and
 * one that points somewhere, such as `Chevron`, mirrors itself in a right-to-left layout.
 */
export type AIIconProps = { color: string; size?: number };

export type AIIcon = ComponentType<AIIconProps>;

/** The icons of the agent replies' views, by what they stand for. */
export const defaultAIIcons = {
  /** A file of an archive type, such as ZIP, on its attachment. */
  Archive: ArchiveIcon,
  /** The button back to the latest message of a conversation. */
  ArrowDown: ArrowDownIcon,
  /** An audio file, on its attachment. */
  Audio: AudioIcon,
  /** A tool call that was cancelled or declined. */
  Cancelled: CancelledIcon,
  /** A tool call that completed. */
  Check: CheckIcon,
  /** A reasoning step's fold. */
  Chevron: ChevronIcon,
  /** The copy action, for a moment after it copied. */
  Copied: CopiedIcon,
  /** The copy action. */
  Copy: CopyIcon,
  /** A tool call that waits for the person's device. */
  Device: DeviceIcon,
  /** The edit action on the person's message. */
  Edit: EditIcon,
  /** A tool call that didn't complete. */
  Failed: FailedIcon,
  /** A file of a type without an icon of its own, on its attachment. */
  File: FileIcon,
  /** A tool call that waits for the person's approval. */
  HandRaised: HandRaisedIcon,
  /** An image shown as a file, such as one without a URL, on its attachment. */
  Image: ImageIcon,
  /** A step this version can't show. */
  Info: InfoIcon,
  /** A tool call that waits for the person to sign in. */
  Key: KeyIcon,
  /** A PDF, on its attachment. */
  Pdf: PdfIcon,
  /** A reasoning step. */
  Reasoning: ReasoningIcon,
  /** The regenerate action. */
  Regenerate: RegenerateIcon,
  /** The share action. */
  Share: ShareIcon,
  /** The bad response rating, and the same once chosen. */
  ThumbsDown: ThumbsDownIcon,
  ThumbsDownFilled: ThumbsDownFilledIcon,
  /** The good response rating, and the same once chosen. */
  ThumbsUp: ThumbsUpIcon,
  ThumbsUpFilled: ThumbsUpFilledIcon,
  /** A video, on its attachment. */
  Video: VideoIcon,
} satisfies Record<string, AIIcon>;

export type AIIcons = Record<keyof typeof defaultAIIcons, AIIcon>;

/** The icons to draw with: the theme's `icons`, over the defaults. */
export const useAIIcons = (): AIIcons => {
  const {
    theme: { icons },
  } = useTheme();
  return useMemo(() => ({ ...defaultAIIcons, ...icons }), [icons]);
};
