import type {
  GestureResponderEvent,
  ImageStyle,
  TextProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { JSX } from 'react';
import type React from 'react';
import { type PropsWithChildren } from 'react';
import type SimpleMarkdown from '@khanacademy/simple-markdown';
import type { Output } from '@khanacademy/simple-markdown';
import { type SingleASTNode, type State } from '@khanacademy/simple-markdown';

export type LinkInfo = {
  raw: string;
  url: string;
};

export type ReactOutput = Output<React.ReactNode>;

export type DefaultRules = typeof SimpleMarkdown.defaultRules;

export type MarkdownRules = Partial<DefaultRules>;

export type MarkdownProps = {
  onLink?: (url: string) => void | Promise<void>;
  rules?: MarkdownRules;
  styles?: MarkdownStyle;
  paragraphNumberOfLines?: number;
};

export type MarkdownOptions = Partial<
  Pick<MarkdownProps, 'onLink' | 'paragraphNumberOfLines'>
>;

export type MarkdownStyleProp = TextStyle | ViewStyle;

export type MarkdownState = State & {
  withinText?: boolean;
  withinQuote?: boolean;
  withinHeading?: boolean;
  withinLink?: boolean;
  withinList?: boolean;
  withinParagraphWithImage?: boolean;
  parentLink?: string;
  style: MarkdownStyleProp;
};

export type NodeWithContent = SingleASTNode & { content: SingleASTNode[] };
export type NodeWithStringContent = SingleASTNode & { content: string };
export type HeadingNode = SingleASTNode & {
  level: number;
  content: SingleASTNode[];
};
export type ListNode = SingleASTNode & {
  ordered: boolean;
  items: SingleASTNode[] | SingleASTNode[][];
};
export type TableNode = SingleASTNode & {
  header: SingleASTNode[];
  cells: SingleASTNode[][];
};
export type TargetNode = SingleASTNode & { target: string };

// Allow dynamic heading style access like styles["heading1"]
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6 | undefined;

export type MarkdownStyle = Partial<{
  autolink: TextStyle;
  blockQuoteBar: ViewStyle;
  blockQuoteSection: ViewStyle;
  blockQuoteSectionBar: ViewStyle;
  blockQuoteText: TextStyle | ViewStyle;
  br: TextStyle;
  codeBlock: TextStyle;
  codeBlockLineNumberGutter: ViewStyle;
  codeBlockContainer: ViewStyle;
  codeBlockWrapper: ViewStyle;
  codeBlockLineNumberCell: TextStyle;
  codeBlockHeaderContainer: ViewStyle;
  codeBlockHeaderTitle: TextStyle;
  del: TextStyle;
  em: TextStyle;
  heading: TextStyle;
  heading1: TextStyle;
  heading2: TextStyle;
  heading3: TextStyle;
  heading4: TextStyle;
  heading5: TextStyle;
  heading6: TextStyle;
  hr: ViewStyle;
  image: ImageStyle;
  inlineCode: TextStyle;
  list: ViewStyle;
  listItem: ViewStyle;
  listItemBullet: TextStyle;
  listItemNumber: TextStyle;
  listItemText: TextStyle;
  listRow: ViewStyle;
  mailTo: TextStyle;
  mentions: TextStyle;
  newline: TextStyle;
  noMargin: TextStyle;
  paragraph: TextStyle;
  paragraphCenter: TextStyle;
  paragraphWithImage: ViewStyle;
  strong: TextStyle;
  sublist: ViewStyle;
  table: ViewStyle;
  tableHeader: ViewStyle;
  tableHeaderCell: TextStyle;
  tableRow: ViewStyle;
  tableRowCell: TextStyle;
  tableRowLast: ViewStyle;
  text: TextStyle;
  u: TextStyle;
  url: TextStyle;
  view: ViewStyle;
}>;

export interface MarkdownOutputProps {
  node: SingleASTNode;
  output: ReactOutput;
  state: State;
  styles: Partial<MarkdownStyle>;
}

export type MarkdownComponentProps = PropsWithChildren<RuleRenderFunctionProps>;

export interface MarkdownTableRowProps extends MarkdownOutputProps {
  items: SingleASTNode[];
}

export interface BulletProps extends TextProps {
  index?: number;
}

export type RuleOutputProps = {
  node: SingleASTNode;
  output: ReactOutput;
  state: MarkdownState;
};

export type RuleRenderFunctionEnrichedProps = {
  styles: MarkdownStyle;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onLink?: (url: string) => void;
  paragraphNumberOfLines?: number;
};

export type RuleRenderFunctionProps = RuleOutputProps &
  RuleRenderFunctionEnrichedProps;

export type RuleRenderFunction = (
  props: RuleRenderFunctionProps,
) => JSX.Element;
