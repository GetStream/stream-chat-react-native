import type { MarkdownStyle } from './markdown';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

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
};
