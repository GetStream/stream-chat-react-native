import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { MarkdownStyle } from './markdown';

export const colors = {
  accent_blue: '#005FFF',
  accent_red: '#FF3742',
  black: '#000000',
  code_block: '#DDDDDD',
  grey: '#7A7A7A',
  grey_neutral: '#9E9E9E',
  grey_dark: '#72767E',
  grey_gainsboro: '#DBDBDB',
  grey_whisper: '#ECEBEB',
  overlay: '#000000CC',
  transparent: 'transparent',
  white: '#FFFFFF',
  white_smoke: '#F2F2F2',
  shimmer: '#FFFFFF',
};

export type Theme = {
  colors: typeof colors;
  markdown: MarkdownStyle;
  composer: {
    container: ViewStyle;
    containerRow: ViewStyle;
    inputPillHeight: number;
    inputPillContainer: ViewStyle;
    inputPill: ViewStyle;
    textInput: TextStyle;
    roundButton: ViewStyle;
    attachIcon: TextStyle;
    mediaPreviewStyle: ViewStyle;
    mediaPreviewContentContainerStyle: ViewStyle;
    mediaPreviewImage: ImageStyle;
    mediaPreviewRemoveButton: ViewStyle;
    micIcon: ViewStyle;
    sendIcon: ViewStyle;
    stopGeneratingIcon: ViewStyle;
    iconButton: ViewStyle;
  };
  sheet: {
    contentContainer: ViewStyle;
    quickActionsCard: ViewStyle;
    divider: ViewStyle;
    listSection: ViewStyle;
    quickAction: ViewStyle;
    quickActionLabel: TextStyle;
    listItem: ViewStyle;
    listIcon: ViewStyle;
    listTextContainer: ViewStyle;
    listTitle: TextStyle;
    listSubtitle: TextStyle;
  };
  aiTypingIndicatorView: {
    text: TextStyle;
  };
  /**
   * `VoiceGlow` and `VoiceWave`. Optional, so a hand-built `Theme` without it keeps type-checking;
   * the visualizations fall back to the default accent then.
   */
  voiceVisualization?: {
    /** One to five colors, used when a visualization is given no `colors` of its own. */
    colors: string[];
    /**
     * The color the visualizations sit on, which tells them to draw for a light or a dark
     * background. Defaults to the system's color scheme.
     */
    backdropColor?: string;
  };
  /**
   * The steps of an agent's reply: reasoning, tool calls and their questions. Optional, so a
   * hand-built `Theme` without it keeps type-checking.
   */
  messageParts?: {
    /** The colour of a completed tool call's check. */
    successColor?: string;
    container?: ViewStyle;
    reasoning?: {
      container?: ViewStyle;
      rule?: ViewStyle;
      header?: ViewStyle;
      title?: TextStyle;
      summary?: TextStyle;
      panel?: ViewStyle;
    };
    toolCall?: {
      container?: ViewStyle;
      title?: TextStyle;
      detail?: TextStyle;
      duration?: TextStyle;
    };
    approvalCard?: {
      container?: ViewStyle;
      title?: TextStyle;
      message?: TextStyle;
      allowButton?: ViewStyle;
      allowButtonText?: TextStyle;
      declineButton?: ViewStyle;
      declineButtonText?: TextStyle;
      failure?: TextStyle;
    };
    unsupported?: {
      container?: ViewStyle;
      text?: TextStyle;
    };
  };
};

export const defaultTheme: Theme = {
  colors,
  markdown: {
    autolink: {},
    blockQuoteSection: {},
    blockQuoteSectionBar: {},
    blockQuoteText: {},
    strong: {},
    codeBlock: {},
    codeBlockWrapper: {},
    codeBlockContainer: {},
    codeBlockHeaderContainer: {},
    codeBlockHeaderTitle: {},
    em: {},
    heading: {},
    heading1: {},
    heading2: {},
    heading3: {},
    heading4: {},
    heading5: {},
    heading6: {},
    hr: {},
    inlineCode: {},
    br: {},
    list: {},
    listItem: {},
    listItemBullet: {},
    listItemNumber: {},
    listItemText: {},
    listRow: {},
    sublist: {},
    url: {},
    noMargin: {},
    paragraph: {},
    paragraphCenter: {},
    del: {},
    text: {},
    table: {},
    tableRow: {},
    tableRowCell: {},
    tableHeader: {},
    tableHeaderCell: {},
  },
  composer: {
    container: {},
    containerRow: {},
    inputPillHeight: 48,
    inputPillContainer: {},
    inputPill: {},
    textInput: {},
    roundButton: {},
    attachIcon: {},
    mediaPreviewStyle: {},
    mediaPreviewContentContainerStyle: {},
    mediaPreviewImage: {},
    mediaPreviewRemoveButton: {},
    micIcon: {},
    sendIcon: {},
    stopGeneratingIcon: {},
    iconButton: {},
  },
  sheet: {
    contentContainer: {},
    quickActionsCard: {},
    divider: {},
    listSection: {},
    quickAction: {},
    quickActionLabel: {},
    listItem: {},
    listIcon: {},
    listTextContainer: {},
    listTitle: {},
    listSubtitle: {},
  },
  aiTypingIndicatorView: {
    text: {},
  },
  voiceVisualization: {
    colors: [colors.accent_blue],
  },
  messageParts: {
    successColor: '#20E070',
    container: {},
    reasoning: { container: {}, rule: {}, header: {}, title: {}, summary: {}, panel: {} },
    toolCall: { container: {}, title: {}, detail: {}, duration: {} },
    approvalCard: {
      container: {},
      title: {},
      message: {},
      allowButton: {},
      allowButtonText: {},
      declineButton: {},
      declineButtonText: {},
      failure: {},
    },
    unsupported: { container: {}, text: {} },
  },
};
