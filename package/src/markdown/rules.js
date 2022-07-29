import React from 'react';
import { Image, Text, View } from 'react-native';
import Lightbox from 'react-native-lightbox';

import { head, includes, map, noop, size, some } from 'lodash';
import SimpleMarkdown from 'simple-markdown';

export default function (styles, opts = {}) {
  const enableLightBox = opts.enableLightBox || false;
  const navigator = opts.navigator;

  const LINK_INSIDE = '(?:\\[[^\\]]*\\]|[^\\]]|\\](?=[^\\[]*\\]))*';
  const LINK_HREF_AND_TITLE = '\\s*<?([^\\s]*?)>?(?:\\s+[\'"]([\\s\\S]*?)[\'"])?\\s*';
  const pressHandler = function (target) {
    if (opts.onLink) {
      opts.onLink(target).catch(function (error) {
        console.log('There has been a problem with this action. ' + error.message);
        throw error;
      });
    }
  };
  const parseInline = function (parse, content, state) {
    const isCurrentlyInline = state.inline || false;
    state.inline = true;
    const result = parse(content, state);
    state.inline = isCurrentlyInline;
    return result;
  };
  const parseCaptureInline = function (capture, parse, state) {
    return {
      content: parseInline(parse, capture[2], state),
    };
  };
  return {
    autolink: {
      react(node, output, { ...state }) {
        state.withinText = true;
        const onPress = () => {
          pressHandler(node.target);
        };
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(node.content, state),
        );
      },
    },
    blockQuote: {
      react(node, output, { ...state }) {
        state.withinQuote = true;

        const img = React.createElement(View, {
          key: state.key - state.key,
          style: [styles.blockQuoteSectionBar, styles.blockQuoteBar],
        });

        const blockQuote = React.createElement(
          Text,
          {
            key: state.key,
            style: styles.blockQuoteText,
          },
          output(node.content, state),
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
      react(node, output, { ...state }) {
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
      react(node, output, { ...state }) {
        state.withinText = true;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.codeBlock,
          },
          node.content,
        );
      },
    },
    del: {
      react(node, output, { ...state }) {
        state.withinText = true;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.del,
          },
          output(node.content, state),
        );
      },
    },
    em: {
      react(node, output, { ...state }) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.em,
        };
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.em,
          },
          output(node.content, state),
        );
      },
    },
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/),
      react(node, output, { ...state }) {
        // const newState = {...state};
        state.withinText = true;
        state.withinHeading = true;

        state.style = {
          ...(state.style || {}),
          ...styles['heading' + node.level],
        };

        const ret = React.createElement(
          Text,
          {
            key: state.key,
            style: state.style,
          },
          output(node.content, state),
        );
        return ret;
      },
    },
    hr: {
      react(node, output, { ...state }) {
        return React.createElement(View, { key: state.key, style: styles.hr });
      },
    },
    image: {
      react(node, output, { ...state }) {
        const imageParam = opts.imageParam ? opts.imageParam : '';
        const target = node.target + imageParam;
        const image = React.createElement(Image, {
          key: state.key,
          // resizeMode: 'contain',
          source: { uri: target },
          style: styles.image,
        });
        if (enableLightBox) {
          return React.createElement(
            Lightbox,
            {
              activeProps: styles.imageBox,
              key: state.key,
              navigator,
              onClose: opts.onImageClose,
              onOpen: opts.onImageOpen,
            },
            image,
          );
        }
        return image;
      },
    },
    inlineCode: {
      parse: parseCaptureInline,
      react(node, output, { ...state }) {
        state.withinText = true;
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.inlineCode,
          },
          output(node.content, state),
        );
      },
    },
    link: {
      match: SimpleMarkdown.inlineRegex(
        new RegExp('^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)'),
      ),
      react(node, output, { ...state }) {
        state.withinLink = true;
        const onPress = () => {
          pressHandler(node.target);
        };
        const link = React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(node.content, state),
        );
        state.withinLink = false;
        return link;
      },
    },
    list: {
      react(node, output, { ...state }) {
        let numberIndex = 1;
        const items = map(node.items, function (item, i) {
          let bullet;
          state.withinList = false;

          if (node.ordered) {
            bullet = React.createElement(
              Text,
              { key: 0, style: styles.listItemNumber },
              numberIndex + '. ',
            );
          } else {
            bullet = React.createElement(Text, { key: 0, style: styles.listItemBullet }, '\u2022 ');
          }

          if (item.length > 1) {
            if (item[1].type === 'list') {
              state.withinList = true;
            }
          }

          const content = output(item, state);
          let listItem;
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
      react(node, output, { ...state }) {
        state.withinText = true;
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress: noop,
            style: styles.mailto,
          },
          output(node.content, state),
        );
      },
    },
    newline: {
      react(node, output, { ...state }) {
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
      react(node, output, { ...state }) {
        let paragraphStyle = styles.paragraph;
        // Allow image to drop in next line within the paragraph
        if (some(node.content, { type: 'image' })) {
          state.withinParagraphWithImage = true;
          const paragraph = React.createElement(
            View,
            {
              key: state.key,
              style: styles.paragraphWithImage,
            },
            output(node.content, state),
          );
          state.withinParagraphWithImage = false;
          return paragraph;
        } else if (size(node.content) < 3 && some(node.content, { type: 'strong' })) {
          // align to center for Strong only content
          // require a check of content array size below 3,
          // as parse will include additional space as `text`
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
          output(node.content, state),
        );
      },
    },
    strong: {
      react(node, output, { ...state }) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.strong,
        };
        return React.createElement(
          Text,
          {
            key: state.key,
            style: state.style,
          },
          output(node.content, state),
        );
      },
    },
    sublist: {
      react(node, output, { ...state }) {
        const items = map(node.items, function (item, i) {
          let bullet;
          if (node.ordered) {
            bullet = React.createElement(
              Text,
              { key: 0, style: styles.listItemNumber },
              i + 1 + '. ',
            );
          } else {
            bullet = React.createElement(Text, { key: 0, style: styles.listItemBullet }, '\u2022 ');
          }

          const content = output(item, state);
          let listItem;
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
      react(node, output, { ...state }) {
        const headers = map(node.header, function (content, i) {
          return React.createElement(
            Text,
            {
              key: i,
              style: styles.tableHeaderCell,
            },
            output(content, state),
          );
        });

        const header = React.createElement(View, { key: -1, style: styles.tableHeader }, headers);

        const rows = map(node.cells, function (row, r) {
          const cells = map(row, function (content, c) {
            return React.createElement(
              View,
              {
                key: c,
                style: styles.tableRowCell,
              },
              output(content, state),
            );
          });
          const rowStyles = [styles.tableRow];
          if (node.cells.length - 1 === r) {
            rowStyles.push(styles.tableRowLast);
          }
          return React.createElement(View, { key: r, style: rowStyles }, cells);
        });

        return React.createElement(View, { key: state.key, style: styles.table }, [header, rows]);
      },
    },
    text: {
      react(node, output, { ...state }) {
        let textStyle = {
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
          node.content,
        );
      },
    },
    u: {
      // u will to the same as strong, to avoid the View nested inside text problem
      react(node, output, { ...state }) {
        state.withinText = true;
        state.style = {
          ...(state.style || {}),
          ...styles.u,
        };
        return React.createElement(
          Text,
          {
            key: state.key,
            style: styles.strong,
          },
          output(node.content, state),
        );
      },
    },
    url: {
      react(node, output, { ...state }) {
        state.withinText = true;
        const onPress = () => {
          pressHandler(node.target);
        };
        return React.createElement(
          Text,
          {
            key: state.key,
            onPress,
            style: styles.autolink,
          },
          output(node.content, state),
        );
      },
    },
  };
}
