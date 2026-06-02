import React, { PropsWithChildren, ReactNode, useCallback, useMemo } from 'react';
import {
  GestureResponderEvent,
  I18nManager,
  Linking,
  Platform,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// @ts-ignore -- no type definitions available for `react-native-markdown-package`
import Markdown from 'react-native-markdown-package';
import Animated, { clamp, scrollTo, useAnimatedRef, useSharedValue } from 'react-native-reanimated';

import {
  DefaultRules,
  defaultRules,
  MatchFunction,
  NodeOutput,
  Output,
  ParseFunction,
  parseInline,
  SingleASTNode,
  State,
} from 'simple-markdown';

import type { LocalMessage, MentionEntity, UserResponse } from 'stream-chat';

import { generateMarkdownText } from './generateMarkdownText';

import type { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import type { MarkdownStyle } from '../../../../contexts/themeContext/utils/theme';

import { primitives } from '../../../../theme';
import { semantics } from '../../../../theme/generated/dark/StreamTokens';
import { escapeRegExp } from '../../../../utils/utils';

type ReactNodeOutput = NodeOutput<React.ReactNode>;
type ReactOutput = Output<React.ReactNode>;

export const MarkdownReactiveScrollView = ({ children }: { children: ReactNode }) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const contentWidth = useSharedValue(0);
  const visibleContentWidth = useSharedValue(0);
  const offsetBeforeScroll = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .onUpdate((event) => {
      const { translationX } = event;

      scrollTo(scrollViewRef, offsetBeforeScroll.value - translationX, 0, false);
    })
    .onEnd((event) => {
      const { translationX } = event;

      const velocityEffect = event.velocityX * 0.3;

      const finalPosition = clamp(
        offsetBeforeScroll.value - translationX - velocityEffect,
        0,
        contentWidth.value - visibleContentWidth.value,
      );

      offsetBeforeScroll.value = finalPosition;

      scrollTo(scrollViewRef, finalPosition, 0, true);
    });

  return (
    <View style={{ width: '100%' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          horizontal
          nestedScrollEnabled={true}
          onContentSizeChange={(width) => {
            contentWidth.value = width;
          }}
          onLayout={(e) => {
            visibleContentWidth.value = e.nativeEvent.layout.width;
          }}
          ref={scrollViewRef}
          scrollEnabled={false}
        >
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
};

const defaultMarkdownStyles: MarkdownStyle = {
  codeBlock: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
    fontWeight: '500',
    marginVertical: primitives.spacingXs,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  // Heading sizes are derived from the body font size (`typographyFontSizeMd`) so they
  // scale with the integrator's typography settings. lineHeight = fontSize × 1.25 to
  // give headings room to breathe. Both fields are required here: without lineHeight,
  // the inherited `lineHeight: typographyLineHeightNormal` (20) from `styles.text` (set
  // in renderText below) leaks into the heading's inner Text via the markdown library's
  // text rule (`{...styles.text, ...state.style}`) and squishes larger heading fontSizes
  // into a 20px line box.
  heading1: {
    fontSize: primitives.typographyFontSizeMd * 2,
    lineHeight: primitives.typographyFontSizeMd * 2 * 1.25,
  },
  heading2: {
    fontSize: primitives.typographyFontSizeMd * 1.5,
    lineHeight: primitives.typographyFontSizeMd * 1.5 * 1.25,
  },
  heading3: {
    fontSize: primitives.typographyFontSizeMd * 1.25,
    lineHeight: primitives.typographyFontSizeMd * 1.25 * 1.25,
  },
  heading4: {
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyFontSizeMd * 1.25,
  },
  heading5: {
    fontSize: primitives.typographyFontSizeMd * 0.875,
    lineHeight: primitives.typographyFontSizeMd * 0.875 * 1.25,
  },
  heading6: {
    fontSize: primitives.typographyFontSizeMd * 0.75,
    lineHeight: primitives.typographyFontSizeMd * 0.75 * 1.25,
  },
  inlineCode: {
    padding: primitives.spacingXxs,
    paddingHorizontal: primitives.spacingXxs,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  list: {
    marginBottom: primitives.spacingXs,
    marginTop: primitives.spacingXs,
  },
  listItemNumber: {
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 0,
  },
  listRow: {
    flexDirection: 'row',
  },
  mentions: {
    fontWeight: '700',
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  paragraph: {
    marginBottom: primitives.spacingXs,
    fontSize: primitives.typographyFontSizeMd,
    marginTop: primitives.spacingXs,
  },
  paragraphCenter: {
    marginBottom: primitives.spacingXs,
    fontSize: primitives.typographyFontSizeMd,
    marginTop: primitives.spacingXs,
  },
  paragraphWithImage: {
    marginBottom: primitives.spacingXs,
    marginTop: primitives.spacingXs,
  },
  table: {
    borderRadius: primitives.radiusXxs,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tableHeaderCell: {
    fontWeight: '500',
  },
  tableRow: {
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tableRowCell: {
    flex: 1,
  },
};

const mentionsParseFunction: ParseFunction = (capture, parse, state) => ({
  content: parseInline(parse, capture[0], state),
});

export type MarkdownRules = Partial<DefaultRules>;

export type RenderTextParams = Partial<
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'preventPress'>
> & {
  semantics: typeof semantics;
  message: LocalMessage;
  markdownRules?: MarkdownRules;
  markdownStyles?: MarkdownStyle;
  messageOverlay?: boolean;
  messageTextNumberOfLines?: number;
  onLink?: (url: string) => Promise<void>;
  onlyEmojis?: boolean;
  isMyMessage?: boolean;
};

export const renderText = (params: RenderTextParams) => {
  const {
    semantics,
    markdownRules,
    markdownStyles,
    message,
    messageOverlay,
    messageTextNumberOfLines,
    onLink: onLinkParams,
    onLongPress: onLongPressParam,
    onlyEmojis,
    onPress: onPressParam,
    preventPress,
    isMyMessage,
  } = params;
  const { text } = message;

  const markdownText = generateMarkdownText(text);

  const styles: MarkdownStyle = {
    ...defaultMarkdownStyles,
    ...markdownStyles,
    paragraph: {
      ...(onlyEmojis ? {} : { lineHeight: primitives.typographyLineHeightNormal }),
      ...defaultMarkdownStyles.paragraph,
      ...markdownStyles?.paragraph,
    },
    paragraphCenter: {
      ...(onlyEmojis ? {} : { lineHeight: primitives.typographyLineHeightNormal }),
      ...defaultMarkdownStyles.paragraphCenter,
      ...markdownStyles?.paragraphCenter,
    },
    autolink: {
      fontSize: primitives.typographyFontSizeMd,
      lineHeight: primitives.typographyLineHeightNormal,
      ...defaultMarkdownStyles.autolink,
      color: semantics.textLink,
      ...markdownStyles?.autolink,
    },
    blockQuoteSection: {
      ...defaultMarkdownStyles.blockQuoteSection,
      flexDirection: 'row',
      padding: primitives.spacingXs,
      ...markdownStyles?.blockQuoteSection,
    },
    blockQuoteSectionBar: {
      ...defaultMarkdownStyles.blockQuoteSectionBar,
      backgroundColor: semantics.borderCoreStrong,
      marginRight: primitives.spacingXs,
      width: 2,
      ...markdownStyles?.blockQuoteSectionBar,
    },
    blockQuoteText: {
      fontSize: primitives.typographyFontSizeMd,
      lineHeight: primitives.typographyLineHeightNormal,
      ...defaultMarkdownStyles.blockQuoteText,
      ...markdownStyles?.blockQuoteText,
    },
    codeBlock: {
      ...defaultMarkdownStyles.codeBlock,
      backgroundColor: semantics.backgroundCoreSurfaceSubtle,
      color: semantics.textPrimary,
      padding: primitives.spacingXs,
      ...markdownStyles?.codeBlock,
    },
    inlineCode: {
      ...defaultMarkdownStyles.inlineCode,
      backgroundColor: semantics.backgroundCoreSurfaceSubtle,
      borderColor: semantics.borderCoreSubtle,
      color: semantics.accentError,
      ...markdownStyles?.inlineCode,
    },
    mentions: {
      ...defaultMarkdownStyles.mentions,
      color: semantics.chatTextMention,
      ...markdownStyles?.mentions,
    },
    table: {
      ...defaultMarkdownStyles.table,
      borderColor: semantics.borderCoreStrong,
      marginVertical: primitives.spacingXs,
      ...markdownStyles?.table,
    },
    tableHeader: {
      ...defaultMarkdownStyles.tableHeader,
      backgroundColor: semantics.backgroundCoreSurfaceSubtle,
      ...markdownStyles?.tableHeader,
    },
    tableHeaderCell: {
      fontSize: primitives.typographyFontSizeMd,
      lineHeight: primitives.typographyLineHeightNormal,
      ...defaultMarkdownStyles.tableHeaderCell,
      padding: primitives.spacingXxs,
      ...markdownStyles?.tableHeaderCell,
    },
    tableRow: {
      ...defaultMarkdownStyles.tableRow,
      ...markdownStyles?.tableRow,
    },
    tableRowCell: {
      ...defaultMarkdownStyles.tableRowCell,
      borderColor: semantics.borderCoreStrong,
      padding: primitives.spacingXxs,
      ...markdownStyles?.tableRowCell,
    },
    tableRowLast: {
      ...markdownStyles?.tableRowLast,
    },
    text: {
      fontSize: primitives.typographyFontSizeMd,
      ...(onlyEmojis ? {} : { lineHeight: primitives.typographyLineHeightNormal }),
      ...defaultMarkdownStyles.text,
      color: isMyMessage ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
      ...markdownStyles?.text,
      writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    },
  };

  const onLink = (url: string) =>
    onLinkParams
      ? onLinkParams(url)
      : Linking.canOpenURL(url).then((canOpenUrl) => canOpenUrl && Linking.openURL(url));

  let previousLink: string | undefined;
  const linkReact: ReactNodeOutput = (node, output, { ...state }) => {
    let url: string;
    // Some long URLs with `&` separated parameters are trimmed and the url only until first param is taken.
    // This is done because of internal link been taken from the original URL in react-native-markdown-package. So, we check for `withinLink` and take the previous full URL.
    if (state?.withinLink && previousLink) {
      url = previousLink;
    } else {
      url = node.target;
      previousLink = node.target;
    }
    const onPress = (event: GestureResponderEvent) => {
      if (!preventPress && onPressParam) {
        onPressParam({
          additionalInfo: { url },
          defaultHandler: () => {
            onLink(url);
          },
          emitter: 'textLink',
          event,
        });
      }
    };

    const onLongPress = (event: GestureResponderEvent) => {
      if (!preventPress && onLongPressParam) {
        onLongPressParam({
          additionalInfo: { url },
          emitter: 'textLink',
          event,
        });
      }
    };

    return (
      <Text
        key={state.key}
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.autolink}
        suppressHighlighting={true}
      >
        {output(node.content, { ...state, withinLink: true })}
      </Text>
    );
  };

  const paragraphTextReact: ReactNodeOutput = (node, output, { ...state }) => {
    if (messageTextNumberOfLines !== undefined) {
      // If we want to truncate the message text, lets only truncate the first paragraph
      // and simply not render rest of the paragraphs.
      if (state.key === '0' || state.key === 0) {
        return (
          <Text key={state.key} numberOfLines={messageTextNumberOfLines} style={styles.paragraph}>
            {output(node.content, state)}
          </Text>
        );
      } else {
        return null;
      }
    }

    return (
      <Text key={state.key} style={styles.paragraph}>
        {output(node.content, state)}
      </Text>
    );
  };

  // Collect every mention type the server sent us into a single typed list so
  // the markdown rule, the lookup, and the press payload all see the same shape.
  const {
    mentioned_channel,
    mentioned_group_ids,
    mentioned_groups,
    mentioned_here,
    mentioned_roles,
    mentioned_users,
  } = message;

  const mentionEntities: MentionEntity[] = [
    ...((mentioned_users ?? []) as UserResponse[]).map(
      (user) => ({ ...user, mentionType: 'user' }) as MentionEntity,
    ),
    ...(mentioned_channel
      ? ([{ id: 'channel', mentionType: 'channel', name: 'channel' }] as MentionEntity[])
      : []),
    ...(mentioned_here
      ? ([{ id: 'here', mentionType: 'here', name: 'here' }] as MentionEntity[])
      : []),
    ...((mentioned_roles ?? []) as string[]).map(
      (role) => ({ id: role, mentionType: 'role', name: role }) as MentionEntity,
    ),
    ...(
      (mentioned_groups ?? (mentioned_group_ids ?? []).map((id) => ({ id, name: id }))) as Array<{
        id: string;
        name?: string;
      }>
    ).map(
      (group) =>
        ({
          id: group.id,
          mentionType: 'user_group',
          name: group.name ?? group.id,
        }) as MentionEntity,
    ),
  ];

  // Lookup keyed by the rendered mention text (sans `@`), lowercased so we
  // resolve case-insensitively. First-write-wins: if a user shares a name with
  // a role/group, the user entity is preferred — same precedence the React SDK
  // applies via insertion order in its plugin.
  const mentionLookup = new Map<string, MentionEntity>();
  for (const entity of mentionEntities) {
    const key = (entity.name ?? entity.id).toLowerCase();
    if (!mentionLookup.has(key)) mentionLookup.set(key, entity);
  }

  const mentionTokens = mentionEntities
    .map((entity) => entity.name ?? entity.id)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.length - a.length)
    .map((value) => `@${escapeRegExp(value)}`)
    .join('|');
  const regEx = new RegExp(`^\\B(${mentionTokens})`, 'g');
  const mentionsMatchFunction: MatchFunction = (source) => regEx.exec(source);

  const colorForMentionType = (mentionType: MentionEntity['mentionType']) => {
    switch (mentionType) {
      case 'user':
        return semantics.chatTextMentionUser;
      case 'channel':
      case 'here':
        return semantics.chatTextMentionBroadcast;
      case 'role':
        return semantics.chatTextMentionRole;
      case 'user_group':
        return semantics.chatTextMentionGroup;
      default:
        return semantics.chatTextMention;
    }
  };

  const mentionsReact: ReactNodeOutput = (node, output, { ...state }) => {
    const matchedText: string | undefined = node.content[0]?.content;
    const matchedName = matchedText?.substring(1) ?? '';
    const matchedEntity = mentionLookup.get(matchedName.toLowerCase());
    const mentionedUser =
      matchedEntity?.mentionType === 'user' ? (matchedEntity as UserResponse) : undefined;
    const mentionColor = matchedEntity
      ? colorForMentionType(matchedEntity.mentionType)
      : semantics.chatTextMention;

    const onPress = (event: GestureResponderEvent) => {
      if (!preventPress && onPressParam) {
        onPressParam({
          additionalInfo: {
            mentionedEntity: matchedEntity,
            user: mentionedUser,
          },
          emitter: 'textMention',
          event,
        });
      }
    };

    const onLongPress = (event: GestureResponderEvent) => {
      if (!preventPress && onLongPressParam) {
        onLongPressParam({
          additionalInfo: {
            mentionedEntity: matchedEntity,
            user: mentionedUser,
          },
          emitter: 'textMention',
          event,
        });
      }
    };

    return (
      <Text
        key={state.key}
        onLongPress={onLongPress}
        onPress={onPress}
        style={[styles.mentions, { color: mentionColor }]}
      >
        {Array.isArray(node.content)
          ? node.content.reduce((acc, current) => acc + current.content, '') || ''
          : output(node.content, state)}
      </Text>
    );
  };

  const listReact: ReactNodeOutput = (node, output, state) => (
    <ListOutput
      key={`list-${state.key}`}
      node={node}
      output={output}
      state={state}
      styles={styles}
    />
  );

  const codeBlockReact: ReactNodeOutput = (node, _, state) => (
    <MarkdownReactiveScrollView key={state.key}>
      <Text style={styles.codeBlock}>{node?.content?.trim()}</Text>
    </MarkdownReactiveScrollView>
  );

  const tableReact: ReactNodeOutput = (node, output, state) => (
    <MarkdownReactiveScrollView key={state.key}>
      <MarkdownTable node={node} output={output} state={state} styles={styles} />
    </MarkdownReactiveScrollView>
  );

  const blockQuoteReact: ReactNodeOutput = (node, output, state) => (
    <View key={state.key} style={styles.blockQuoteSection}>
      <View style={styles.blockQuoteSectionBar} />
      <View style={styles.blockQuoteText}>{output(node.content, state)}</View>
    </View>
  );

  const customRules = {
    blockQuote: {
      react: blockQuoteReact,
    },
    codeBlock: { react: codeBlockReact },
    // do not render images, we will scrape them out of the message and show on attachment card component
    image: { match: () => null },
    link: { react: linkReact },
    list: { react: listReact },
    // Truncate long text content in the message overlay
    paragraph: messageTextNumberOfLines ? { react: paragraphTextReact } : {},
    // we have no react rendering support for reflinks
    reflink: { match: () => null },
    sublist: { react: listReact },
    ...(mentionTokens
      ? {
          mentions: {
            match: mentionsMatchFunction,
            order: defaultRules.text.order - 0.5,
            parse: mentionsParseFunction,
            react: mentionsReact,
          },
        }
      : {}),
    table: { react: tableReact },
  };

  return (
    <Markdown
      key={`${JSON.stringify(mentionEntities)}-${onlyEmojis}-${
        messageOverlay ? JSON.stringify(markdownStyles) : undefined
      }-${JSON.stringify(semantics)}`}
      onLink={onLink}
      rules={{
        ...customRules,
        ...markdownRules,
      }}
      styles={styles}
    >
      {markdownText}
    </Markdown>
  );
};

export interface ListOutputProps {
  node: SingleASTNode;
  output: ReactOutput;
  state: State;
  styles?: Partial<MarkdownStyle>;
}

/**
 * For lists and sublists, the default behavior of the markdown library we use is
 * to always renumber any list, so all ordered lists start from 1.
 *
 * This custom rule overrides this behavior both for top level lists and sublists,
 * in order to start the numbering from the number of the first list item provided.
 */
export const ListOutput = ({ node, output, state, styles }: ListOutputProps) => {
  let isSublist = state.withinList;
  const parentTypes = ['text', 'paragraph', 'strong'];

  return (
    <View key={state.key} style={isSublist ? styles?.sublist : styles?.list}>
      {node.items.map((item: SingleASTNode, index: number) => {
        const indexAfterStart = node.start + index;

        if (item === null) {
          return (
            <ListRow key={index} style={styles?.listRow} testID='list-item'>
              <Bullet
                index={node.ordered && indexAfterStart}
                style={node.ordered ? styles?.listItemNumber : styles?.listItemBullet}
              />
            </ListRow>
          );
        }

        isSublist = item.length > 1 && item[1].type === 'list';
        const isSublistWithinText = parentTypes.includes((item[0] ?? {}).type) && isSublist;
        const style = isSublistWithinText ? { marginBottom: 0 } : {};

        return (
          <ListRow key={index} style={styles?.listRow} testID='list-item'>
            <Bullet
              index={node.ordered && indexAfterStart}
              style={node.ordered ? styles?.listItemNumber : styles?.listItemBullet}
            />
            <ListItem key={1} style={[styles?.listItemText, style]}>
              {output(item, state)}
            </ListItem>
          </ListRow>
        );
      })}
    </View>
  );
};

interface BulletProps extends TextProps {
  index?: number;
}

const Bullet = ({ index, style }: BulletProps) => (
  <Text key={0} style={style}>
    {index ? `${index}. ` : '\u2022 '}
  </Text>
);

const ListRow = ({ children, style }: PropsWithChildren<ViewProps>) => (
  <View style={style}>{children}</View>
);

const ListItem = ({ children, style }: PropsWithChildren<TextProps>) => (
  <Text style={style}>{children}</Text>
);

export type MarkdownTableProps = {
  node: SingleASTNode;
  output: ReactOutput;
  state: State;
  styles: Partial<MarkdownStyle>;
};

const transpose = (matrix: SingleASTNode[][]) =>
  matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));

const MarkdownTable = ({ node, output, state, styles }: MarkdownTableProps) => {
  const content = useMemo(() => {
    const nodeContent = [node?.header, ...(node?.cells ?? null)];
    return transpose(nodeContent);
  }, [node?.cells, node?.header]);
  const columns = content?.map((column, idx) => (
    <MarkdownTableColumn
      items={column}
      key={`column-${idx}`}
      output={output}
      state={state}
      styles={styles}
    />
  ));

  return (
    <View key={state.key} style={styles.table}>
      {columns}
    </View>
  );
};

export type MarkdownTableRowProps = {
  items: SingleASTNode[];
  output: ReactOutput;
  state: State;
  styles: Partial<MarkdownStyle>;
};

const MarkdownTableColumn = ({ items, output, state, styles }: MarkdownTableRowProps) => {
  const [headerCellContent, ...columnCellContents] = items;

  const ColumnCell = useCallback(
    ({ content }: { content: SingleASTNode }) =>
      content ? (
        <View style={styles.tableRow}>
          <View style={styles.tableRowCell}>{output(content, state)}</View>
        </View>
      ) : null,
    [output, state, styles],
  );

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {headerCellContent ? (
        <View key={-1} style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>{output(headerCellContent, state)}</Text>
        </View>
      ) : null}
      {columnCellContents &&
        columnCellContents.map((content, idx) => (
          <ColumnCell content={content} key={`cell-${idx}`} />
        ))}
    </View>
  );
};
