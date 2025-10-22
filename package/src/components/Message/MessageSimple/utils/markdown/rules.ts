// import React from 'react';
//
// import { Text, View } from 'react-native';
//
// import SimpleMarkdown from '@khanacademy/simple-markdown';
// import { head, includes, map, noop, size, some } from 'lodash';
//
// import { MarkdownStyle } from '../../../../../contexts';
//
// import { MarkdownOptions } from './index';
//
// export const getLocalRules = (styles: MarkdownStyle, opts: MarkdownOptions = {}) => {
//   const LINK_INSIDE = '(?:\\[[^\\]]*\\]|[^\\]]|\\](?=[^\\[]*\\]))*';
//   const LINK_HREF_AND_TITLE = '\\s*<?([^\\s]*?)>?(?:\\s+[\'"]([\\s\\S]*?)[\'"])?\\s*';
//   const pressHandler = function (target) {
//     if (opts.onLink) {
//       opts.onLink(target).catch(function (error) {
//         console.log('There has been a problem with this action. ' + error.message);
//         throw error;
//       });
//     }
//   };
//   const parseInline = function (parse, content, state) {
//     const isCurrentlyInline = state.inline || false;
//     state.inline = true;
//     const result = parse(content, state);
//     state.inline = isCurrentlyInline;
//     return result;
//   };
//   const parseCaptureInline = function (capture, parse, state) {
//     return {
//       content: parseInline(parse, capture[2], state),
//     };
//   };
//   return {
//     autolink: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         const _pressHandler = () => {
//           pressHandler(node.target);
//         };
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.autolink,
//             onPress: _pressHandler,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     blockQuote: {
//       react(node, output, { ...state }) {
//         state.withinQuote = true;
//
//         const img = React.createElement(View, {
//           key: state.key - state.key,
//           style: [styles.blockQuoteSectionBar, styles.blockQuoteBar],
//         });
//
//         const blockQuote = React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.blockQuoteText,
//           },
//           output(node.content, state),
//         );
//
//         return React.createElement(
//           View,
//           {
//             key: state.key,
//             style: [styles.blockQuoteSection, styles.blockQuoteText],
//           },
//           [img, blockQuote],
//         );
//       },
//     },
//     br: {
//       react(node, output, { ...state }) {
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.br,
//           },
//           '\n\n',
//         );
//       },
//     },
//     codeBlock: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.codeBlock,
//           },
//           node.content,
//         );
//       },
//     },
//     del: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.del,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     em: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         state.style = {
//           ...(state.style || {}),
//           ...styles.em,
//         };
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.em,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     heading: {
//       match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/),
//       react(node, output, { ...state }) {
//         // const newState = {...state};
//         state.withinText = true;
//         state.withinHeading = true;
//
//         state.style = {
//           ...(state.style || {}),
//           ...styles[`heading${node.level}`],
//         };
//
//         const ret = React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: state.style,
//           },
//           output(node.content, state),
//         );
//         return ret;
//       },
//     },
//     hr: {
//       react(node, output, { ...state }) {
//         return React.createElement(View, { key: state.key, style: styles.hr });
//       },
//     },
//     image: {
//       match: () => null,
//     },
//     inlineCode: {
//       parse: parseCaptureInline,
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.inlineCode,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     link: {
//       match: SimpleMarkdown.inlineRegex(
//         new RegExp('^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)'),
//       ),
//       react(node, output, { ...state }) {
//         state.withinLink = true;
//         const _pressHandler = () => {
//           pressHandler(node.target);
//         };
//         const link = React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.autolink,
//             onPress: _pressHandler,
//           },
//           output(node.content, state),
//         );
//         state.withinLink = false;
//         return link;
//       },
//     },
//     list: {
//       react(node, output, { ...state }) {
//         let numberIndex = 1;
//         const items = map(node.items, function (item, i) {
//           let bullet;
//           state.withinList = false;
//
//           if (node.ordered) {
//             bullet = React.createElement(
//               Text,
//               { key: 0, style: [styles.text, styles.listItemNumber] },
//               numberIndex + '. ',
//             );
//           } else {
//             bullet = React.createElement(
//               Text,
//               { key: 0, style: [styles.text, styles.listItemBullet] },
//               '\u2022 ',
//             );
//           }
//
//           if (item.length > 1) {
//             if (item[1].type == 'list') {
//               state.withinList = true;
//             }
//           }
//
//           const content = output(item, state);
//           let listItem;
//           if (
//             includes(['text', 'paragraph', 'strong'], (head(item) || {}).type) &&
//             state.withinList == false
//           ) {
//             state.withinList = true;
//             listItem = React.createElement(
//               Text,
//               {
//                 style: [styles.listItemText, { marginBottom: 0 }],
//                 key: 1,
//               },
//               content,
//             );
//           } else {
//             listItem = React.createElement(
//               View,
//               {
//                 style: styles.listItemText,
//                 key: 1,
//               },
//               content,
//             );
//           }
//           state.withinList = false;
//           numberIndex++;
//
//           return React.createElement(
//             View,
//             {
//               key: i,
//               style: styles.listRow,
//             },
//             [bullet, listItem],
//           );
//         });
//
//         return React.createElement(View, { key: state.key, style: styles.list }, items);
//       },
//     },
//     sublist: {
//       react(node, output, { ...state }) {
//         const items = map(node.items, function (item, i) {
//           let bullet;
//           if (node.ordered) {
//             bullet = React.createElement(
//               Text,
//               { key: 0, style: [styles.text, styles.listItemNumber] },
//               i + 1 + '. ',
//             );
//           } else {
//             bullet = React.createElement(
//               Text,
//               { key: 0, style: [styles.text, styles.listItemBullet] },
//               '\u2022 ',
//             );
//           }
//
//           const content = output(item, state);
//           let listItem;
//           state.withinList = true;
//           if (includes(['text', 'paragraph', 'strong'], (head(item) || {}).type)) {
//             listItem = React.createElement(
//               Text,
//               {
//                 style: styles.listItemText,
//                 key: 1,
//               },
//               content,
//             );
//           } else {
//             listItem = React.createElement(
//               View,
//               {
//                 style: styles.listItem,
//                 key: 1,
//               },
//               content,
//             );
//           }
//           state.withinList = false;
//           return React.createElement(
//             View,
//             {
//               key: i,
//               style: styles.listRow,
//             },
//             [bullet, listItem],
//           );
//         });
//
//         return React.createElement(View, { key: state.key, style: styles.sublist }, items);
//       },
//     },
//     mailto: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.mailto,
//             onPress: noop,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     newline: {
//       react(node, output, { ...state }) {
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.newline,
//           },
//           '\n',
//         );
//       },
//     },
//     paragraph: {
//       react(node, output, { ...state }) {
//         let paragraphStyle = styles.paragraph;
//         // Allow image to drop in next line within the paragraph
//         if (some(node.content, { type: 'image' })) {
//           state.withinParagraphWithImage = true;
//           const paragraph = React.createElement(
//             View,
//             {
//               key: state.key,
//               style: styles.paragraphWithImage,
//             },
//             output(node.content, state),
//           );
//           state.withinParagraphWithImage = false;
//           return paragraph;
//         } else if (size(node.content) < 3 && some(node.content, { type: 'strong' })) {
//           // align to center for Strong only content
//           // require a check of content array size below 3,
//           // as parse will include additional space as `text`
//           paragraphStyle = styles.paragraphCenter;
//         }
//         if (state.withinList) {
//           paragraphStyle = [paragraphStyle, styles.noMargin];
//         }
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: paragraphStyle,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     strong: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         state.style = {
//           ...(state.style || {}),
//           ...styles.strong,
//         };
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: state.style,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     table: {
//       react(node, output, { ...state }) {
//         const headers = map(node.header, function (content, i) {
//           return React.createElement(
//             Text,
//             {
//               key: i,
//               style: styles.tableHeaderCell,
//             },
//             output(content, state),
//           );
//         });
//
//         const header = React.createElement(View, { key: -1, style: styles.tableHeader }, headers);
//
//         const rows = map(node.cells, function (row, r) {
//           const cells = map(row, function (content, c) {
//             return React.createElement(
//               View,
//               {
//                 key: c,
//                 style: styles.tableRowCell,
//               },
//               output(content, state),
//             );
//           });
//           const rowStyles = [styles.tableRow];
//           if (node.cells.length - 1 == r) {
//             rowStyles.push(styles.tableRowLast);
//           }
//           return React.createElement(View, { key: r, style: rowStyles }, cells);
//         });
//
//         return React.createElement(View, { key: state.key, style: styles.table }, [header, rows]);
//       },
//     },
//     text: {
//       react(node, output, { ...state }) {
//         let textStyle = {
//           ...styles.text,
//           ...(state.style || {}),
//         };
//
//         if (state.withinLink) {
//           textStyle = [styles.text, styles.autolink];
//         }
//
//         if (state.withinQuote) {
//           textStyle = [styles.text, styles.blockQuoteText];
//         }
//
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: textStyle,
//           },
//           node.content,
//         );
//       },
//     },
//     u: {
//       // u will to the same as strong, to avoid the View nested inside text problem
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         state.style = {
//           ...(state.style || {}),
//           ...styles.u,
//         };
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.strong,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//     url: {
//       react(node, output, { ...state }) {
//         state.withinText = true;
//         const _pressHandler = () => {
//           pressHandler(node.target);
//         };
//         return React.createElement(
//           Text,
//           {
//             key: state.key,
//             style: styles.autolink,
//             onPress: _pressHandler,
//           },
//           output(node.content, state),
//         );
//       },
//     },
//   };
// };

import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import SimpleMarkdown, {
  MatchFunction,
  Output,
  OutputRules,
  ParseFunction,
  Parser,
  ReactOutputRule,
  SingleASTNode,
  State,
} from '@khanacademy/simple-markdown';
import { head, includes, map, noop, size, some } from 'lodash';

import { MarkdownStyle } from '../../../../../contexts';

import { MarkdownOptions } from './index';

type MarkdownStyleProp = TextStyle | ViewStyle;

type MarkdownState = State & {
  key: number | string;
  inline?: boolean;
  withinText?: boolean;
  withinQuote?: boolean;
  withinHeading?: boolean;
  withinLink?: boolean;
  withinList?: boolean;
  withinParagraphWithImage?: boolean;
  style: MarkdownStyleProp;
};

type NodeWithContent = SingleASTNode & { content: SingleASTNode[] };
type NodeWithStringContent = SingleASTNode & { content: string };
type HeadingNode = SingleASTNode & { level: number; content: SingleASTNode[] };
type ListNode = SingleASTNode & {
  ordered: boolean;
  items: SingleASTNode[] | SingleASTNode[][];
};
type TableNode = SingleASTNode & {
  header: SingleASTNode[];
  cells: SingleASTNode[][];
};
type TargetNode = SingleASTNode & { target: string };

// Allow dynamic heading style access like styles["heading1"]
type HeadingStyles = Record<string, MarkdownStyleProp>;

export const getLocalRules = (
  styles: MarkdownStyle,
  opts: MarkdownOptions = {},
): OutputRules<ReactOutputRule> => {
  const LINK_INSIDE = '(?:\\[[^\\]]*\\]|[^\\]]|\\](?=[^\\[]*\\]))*';
  const LINK_HREF_AND_TITLE = '\\s*<?([^\\s]*?)>?(?:\\s+[\'"]([\\s\\S]*?)[\'"])?\\s*';

  const pressHandler = (target: string) => {
    if (opts.onLink) {
      // user-supplied handler may be async; we keep your behavior
      Promise.resolve(opts.onLink(target)).catch((error: unknown) => {
        const msg =
          error && typeof error === 'object' && 'toString' in error
            ? String(error)
            : 'Unknown error';

        console.log('There has been a problem with this action. ' + msg);
        throw error;
      });
    }
  };

  const parseInline = function (
    parse: Parser,
    content: string,
    state: MarkdownState,
  ): SingleASTNode[] {
    const isCurrentlyInline = state.inline || false;
    state.inline = true;
    const result = parse(content, state);
    state.inline = isCurrentlyInline;
    return result;
  };

  const parseCaptureInline: ParseFunction = (capture, parse, state) => {
    return {
      content: parseInline(
        parse,
        // capture[2] is the inner content for inline code
        String((capture as unknown as RegExpMatchArray)[2] ?? ''),
        state as MarkdownState,
      ),
      type: 'inlineCode', // type is ignored by your renderer; safe to include
    } as unknown as SingleASTNode;
  };

  return {
    autolink: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithContent & TargetNode;
        const onPress = () => pressHandler(n.target);
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(n.content, state),
        );
      },
    },
    blockQuote: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinQuote = true;
        const n = node as NodeWithContent;

        const img = React.createElement(View, {
          key: Number(state.key) - Number(state.key),
          style: [styles.blockQuoteSectionBar, styles.blockQuoteBar],
        });

        const blockQuote = React.createElement(
          Text,
          {
            key: state.key,
            style: styles.blockQuoteText,
          },
          output(n.content, state),
        );

        return React.createElement(
          View,
          {
            key: state.key,
            style: [styles.blockQuoteSection, styles.blockQuoteText],
          },
          [img, blockQuote],
        );
      },
    },
    br: {
      react(_node: SingleASTNode, _output: Output<React.ReactNode>, state: MarkdownState) {
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.br,
          },
          '\n\n',
        );
      },
    },
    codeBlock: {
      react(node: SingleASTNode, _output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithStringContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.codeBlock,
          },
          n.content,
        );
      },
    },
    del: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.del,
          },
          output(n.content, state),
        );
      },
    },
    em: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.em,
        };
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.em,
          },
          output(n.content, state),
        );
      },
    },
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/) as MatchFunction,
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        state.withinHeading = true;

        const n = node as HeadingNode;
        const dynHeadingStyle = (styles as unknown as HeadingStyles)[`heading${n.level}`];

        state.style = {
          ...(state.style || {}),
          ...dynHeadingStyle,
        };

        const ret = React.createElement(
          Text,
          {
            key: state.key,
            style: state.style,
          },
          output(n.content, state),
        );
        return ret;
      },
    },
    hr: {
      react(_node: SingleASTNode, _output: Output<React.ReactNode>, state: MarkdownState) {
        return React.createElement(View, { key: state.key, style: styles.hr });
      },
    },
    image: {
      // You intentionally disable parsing images; keep the shape
      match: (() => null) as unknown as MatchFunction,
    },
    inlineCode: {
      parse: parseCaptureInline,
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.inlineCode,
          },
          output(n.content, state),
        );
      },
    },
    link: {
      match: SimpleMarkdown.inlineRegex(
        new RegExp('^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)'),
      ) as MatchFunction,
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinLink = true;
        const n = node as NodeWithContent & TargetNode;
        const onPress = () => pressHandler(n.target);
        const link = React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(n.content, state),
        );
        state.withinLink = false;
        return link;
      },
    },
    list: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        let numberIndex = 1;
        const n = node as ListNode;

        const items = map(n.items as SingleASTNode[][], (item, i) => {
          let bullet: React.ReactNode;
          state.withinList = false;

          if (n.ordered) {
            bullet = React.createElement(
              Text,
              { key: 0, style: [styles.text, styles.listItemNumber] },
              numberIndex + '. ',
            );
          } else {
            bullet = React.createElement(
              Text,
              { key: 0, style: [styles.text, styles.listItemBullet] },
              '\u2022 ',
            );
          }

          if ((item as SingleASTNode[]).length > 1) {
            if ((item as SingleASTNode[])[1].type === 'list') {
              state.withinList = true;
            }
          }

          const content = output(item as unknown as SingleASTNode[], state);

          let listItem: React.ReactNode;
          if (
            includes(['text', 'paragraph', 'strong'], (head(item) || {}).type) &&
            state.withinList === false
          ) {
            state.withinList = true;
            listItem = React.createElement(
              Text,
              {
                key: 1,
                style: [styles.listItemText, { marginBottom: 0 }],
              },
              content,
            );
          } else {
            listItem = React.createElement(
              View,
              {
                key: 1,
                style: styles.listItemText,
              },
              content,
            );
          }
          state.withinList = false;
          numberIndex++;

          return React.createElement(
            View,
            {
              key: i,
              style: styles.listRow,
            },
            [bullet, listItem],
          );
        });

        return React.createElement(View, { key: state.key, style: styles.list }, items);
      },
    },
    mailto: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress: noop,
            style: styles.autolink,
          },
          output(n.content, state),
        );
      },
    },
    newline: {
      react(_node: SingleASTNode, _output: Output<React.ReactNode>, state: MarkdownState) {
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.newline,
          },
          '\n',
        );
      },
    },
    paragraph: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        const n = node as NodeWithContent;
        let paragraphStyle: TextStyle | (TextStyle | undefined)[] | undefined = styles.paragraph;

        // Allow image to drop in next line within the paragraph
        if (some(n.content, { type: 'image' })) {
          state.withinParagraphWithImage = true;
          const paragraph = React.createElement(
            View,
            {
              key: state.key,
              style: styles.paragraphWithImage,
            },
            output(n.content, state),
          );
          state.withinParagraphWithImage = false;
          return paragraph;
        } else if (size(n.content) < 3 && some(n.content, { type: 'strong' })) {
          // center for Strong-only content
          paragraphStyle = styles.paragraphCenter;
        }
        if (state.withinList) {
          paragraphStyle = [paragraphStyle, styles.noMargin];
        }
        return React.createElement(
          Text,
          {
            key: state.key,
            style: paragraphStyle,
          },
          output(n.content, state),
        );
      },
    },
    strong: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.strong,
        };
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: state.style,
          },
          output(n.content, state),
        );
      },
    },
    sublist: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        const n = node as ListNode;

        const items = map(n.items as SingleASTNode[][], (item, i) => {
          let bullet: React.ReactNode;
          if (n.ordered) {
            bullet = React.createElement(
              Text,
              { key: 0, style: [styles.text, styles.listItemNumber] },
              i + 1 + '. ',
            );
          } else {
            bullet = React.createElement(
              Text,
              { key: 0, style: [styles.text, styles.listItemBullet] },
              '\u2022 ',
            );
          }

          const content = output(item as unknown as SingleASTNode[], state);
          let listItem: React.ReactNode;
          state.withinList = true;
          if (includes(['text', 'paragraph', 'strong'], (head(item) || {}).type)) {
            listItem = React.createElement(
              Text,
              {
                key: 1,
                style: styles.listItemText,
              },
              content,
            );
          } else {
            listItem = React.createElement(
              View,
              {
                key: 1,
                style: styles.listItem,
              },
              content,
            );
          }
          state.withinList = false;
          return React.createElement(
            View,
            {
              key: i,
              style: styles.listRow,
            },
            [bullet, listItem],
          );
        });

        return React.createElement(View, { key: state.key, style: styles.sublist }, items);
      },
    },
    table: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        const n = node as TableNode;

        const headers = map(n.header, (content, i) =>
          React.createElement(
            Text,
            {
              key: i,
              style: styles.tableHeaderCell,
            },
            output(content, state),
          ),
        );

        const header = React.createElement(View, { key: -1, style: styles.tableHeader }, headers);

        const rows = map(n.cells, (row, r) => {
          const cells = map(row, (content, c) =>
            React.createElement(
              View,
              {
                key: c,
                style: styles.tableRowCell,
              },
              output(content, state),
            ),
          );
          const rowStyles: (TextStyle | ViewStyle | undefined)[] = [styles.tableRow];
          if (n.cells.length - 1 === r) {
            rowStyles.push(styles.tableRowLast);
          }
          return React.createElement(View, { key: r, style: rowStyles }, cells);
        });

        return React.createElement(View, { key: state.key, style: styles.table }, [header, rows]);
      },
    },
    text: {
      react(node: SingleASTNode, _output: Output<React.ReactNode>, state: MarkdownState) {
        const n = node as NodeWithStringContent;
        let textStyle: TextStyle | (TextStyle | ViewStyle | undefined)[] = {
          ...styles.text,
          ...(state.style || {}),
        };

        if (state.withinLink) {
          textStyle = [styles.text, styles.autolink];
        }

        if (state.withinQuote) {
          textStyle = [styles.text, styles.blockQuoteText];
        }

        return React.createElement(
          Text,
          {
            key: state.key,
            style: textStyle,
          },
          n.content,
        );
      },
    },
    u: {
      // u will do the same as strong, to avoid the View nested inside text problem
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.u,
        };
        const n = node as NodeWithContent;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.strong,
          },
          output(n.content, state),
        );
      },
    },
    url: {
      react(node: SingleASTNode, output: Output<React.ReactNode>, state: MarkdownState) {
        state.withinText = true;
        const n = node as NodeWithContent & TargetNode;
        const onPress = () => pressHandler(n.target);
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(n.content, state),
        );
      },
    },
  } as unknown as OutputRules<ReactOutputRule>;
};
