import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { AIIcons } from './icons';
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
    /** What `ComposerView`'s `trailing` sits in, after the message box. */
    trailing: ViewStyle;
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
    authorizationCard?: {
      container?: ViewStyle;
      title?: TextStyle;
      message?: TextStyle;
      outcome?: TextStyle;
      connectButton?: ViewStyle;
      connectButtonText?: TextStyle;
      declineButton?: ViewStyle;
      declineButtonText?: TextStyle;
      failure?: TextStyle;
    };
    unsupported?: {
      container?: ViewStyle;
      text?: TextStyle;
    };
  };
  /**
   * `AIConversation`: the list of turns, the spinner while older messages load, and the button back
   * to the latest message. Optional, so a hand-built `Theme` without it keeps type-checking.
   */
  conversation?: {
    /** The spinner while older messages load. */
    loadingIndicator?: string;
    /** The button back to the latest message. */
    scrollButtonBackground?: string;
    scrollButtonBorder?: string;
    scrollButtonIcon?: string;
    container?: ViewStyle;
    /** The list's content: the turns, with the room around them. */
    content?: ViewStyle;
    /** What shows while there are no messages. */
    empty?: ViewStyle;
    loadingOlder?: ViewStyle;
    scrollButton?: ViewStyle;
    /** The view around each message, and around what ends the latest turn. */
    row?: ViewStyle;
  };
  /**
   * Icons of your own for the agent replies' views, by name, over `defaultAIIcons`. Kept as they
   * are when themes merge.
   */
  icons?: Partial<AIIcons>;
  /**
   * The person's and the agent's messages, what they carry, and the actions under a reply.
   * Optional, so a hand-built `Theme` without it keeps type-checking.
   */
  message?: {
    /** The person's bubble. */
    userMessageBackground?: string;
    userMessageText?: string;
    /** The icons of the actions under a reply. */
    messageAction?: string;
    /** A file's card, and the tile with its type's icon. */
    attachmentBackground?: string;
    attachmentBorder?: string;
    attachmentIcon?: string;
    attachmentIconBackground?: string;
    attachmentName?: string;
    attachmentDetails?: string;
    /** What an image shows while it loads, or when it can't. */
    attachmentImagePlaceholder?: string;
    userMessage?: {
      container?: ViewStyle;
      attachments?: ViewStyle;
      bubble?: ViewStyle;
      text?: TextStyle;
      editButton?: ViewStyle;
      /** The menu a long press on the message opens, and its items. */
      menu?: ViewStyle;
      menuItem?: ViewStyle;
      menuItemText?: TextStyle;
    };
    assistantMessage?: {
      container?: ViewStyle;
      attachments?: ViewStyle;
    };
    attachment?: {
      image?: ImageStyle;
      file?: ViewStyle;
      fileIcon?: ViewStyle;
      fileName?: TextStyle;
      fileDetails?: TextStyle;
    };
    replyActions?: {
      container?: ViewStyle;
      button?: ViewStyle;
    };
  };
  /**
   * The composer's chat options: the menu in its sheet, and the chip of the one picked. Optional,
   * so a hand-built `Theme` without it keeps type-checking.
   */
  chatOptions?: {
    /** The picked option's chip. */
    chipBackground?: string;
    chipText?: string;
    /** An option's description in the menu. */
    descriptionText?: string;
    /** An option's title in the menu. */
    titleText?: string;
    list?: ViewStyle;
    item?: ViewStyle;
    itemIcon?: ViewStyle;
    itemTitle?: TextStyle;
    itemDescription?: TextStyle;
    chip?: ViewStyle;
    chipIcon?: ViewStyle;
    chipTitle?: TextStyle;
    chipRemoveButton?: ViewStyle;
  };
  /** `AISuggestions`: the starters of an empty conversation. Optional, as above. */
  suggestions?: {
    background?: string;
    text?: string;
    container?: ViewStyle;
    content?: ViewStyle;
    item?: ViewStyle;
    itemText?: TextStyle;
  };
  /** The UI the agent generates for a reply, in place of its text. Optional, as above. */
  generatedUI?: {
    /** What a reply's generated UI sits in, as wide as the reply. */
    container?: ViewStyle;
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
    trailing: {},
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
    authorizationCard: {
      container: {},
      title: {},
      message: {},
      outcome: {},
      connectButton: {},
      connectButtonText: {},
      declineButton: {},
      declineButtonText: {},
      failure: {},
    },
    unsupported: { container: {}, text: {} },
  },
  conversation: {
    // StreamChatAI's defaults, from the shared design tokens.
    loadingIndicator: '#414552',
    scrollButtonBackground: '#FFFFFF',
    scrollButtonBorder: '#D5DBE1',
    scrollButtonIcon: '#1A1B25',
    container: {},
    content: {},
    empty: {},
    loadingOlder: {},
    scrollButton: {},
    row: {},
  },
  message: {
    // StreamChatAI's and the Android AI SDK's defaults, from the shared design tokens.
    userMessageBackground: '#EBEEF1',
    userMessageText: '#1A1B25',
    messageAction: '#414552',
    attachmentBackground: '#FFFFFF',
    attachmentBorder: '#D5DBE1',
    attachmentIcon: '#FFFFFF',
    attachmentIconBackground: '#005FFF',
    attachmentName: '#1A1B25',
    attachmentDetails: '#414552',
    attachmentImagePlaceholder: '#F6F8FA',
    userMessage: {
      container: {},
      attachments: {},
      bubble: {},
      text: {},
      editButton: {},
      menu: {},
      menuItem: {},
      menuItemText: {},
    },
    assistantMessage: { container: {}, attachments: {} },
    attachment: { image: {}, file: {}, fileIcon: {}, fileName: {}, fileDetails: {} },
    replyActions: { container: {}, button: {} },
  },
  chatOptions: {
    // StreamChatAI's defaults, from the shared design tokens.
    chipBackground: '#FFFFFF',
    chipText: '#005FFF',
    descriptionText: '#414552',
    titleText: '#1A1B25',
    list: {},
    item: {},
    itemIcon: {},
    itemTitle: {},
    itemDescription: {},
    chip: {},
    chipIcon: {},
    chipTitle: {},
    chipRemoveButton: {},
  },
  suggestions: {
    // StreamChatAI's defaults, from the shared design tokens.
    background: '#EBEEF1',
    text: '#1A1B25',
    container: {},
    content: {},
    item: {},
    itemText: {},
  },
  generatedUI: {
    container: {},
  },
};
