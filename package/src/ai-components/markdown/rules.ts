import type React from 'react';

import type {
  MatchFunction,
  Output,
  OutputRules,
  ParseFunction,
  Parser,
  ReactOutputRule,
  SingleASTNode,
} from '@khanacademy/simple-markdown';
import SimpleMarkdown from '@khanacademy/simple-markdown';

import type {
  MarkdownOptions,
  MarkdownState,
  MarkdownStyle,
  RuleRenderFunction,
  RuleRenderFunctionEnrichedProps,
} from './types';
import {
  renderAutolink,
  renderBlockQuote,
  renderBold,
  renderCodeBlock,
  renderEmphasis,
  renderHeading,
  renderHorizontalRule,
  renderInlineCode,
  renderLineBreak,
  renderLink,
  renderList,
  renderMailto,
  renderNewLine,
  renderParagraph,
  renderStrikethrough,
  renderTable,
  renderText,
  renderUrl,
} from './components';

const LINK_INSIDE = '(?:\\[(?:\\\\.|[^\\\\\\[\\]])*\\]|\\\\.|[^\\[\\]\\\\])*';
/**
 * Href + optional title (escape-aware). Group 1 === href (angle or bare).
 * The title is in groups 2, 3 or 4.
 */
const LINK_HREF_AND_TITLE =
  '\\s*<?([^\\s>]*?)>?\\s*' + // 1: href
  '(?:' +
  '\\\\"((?:\\\\.|[^"\\\\])*)\\\\"' + // 2: "title"
  "|\\\\'((?:\\\\.|[^'\\\\])*)\\\\'" + // 3: 'title'
  '|\\(((?:\\\\.|[^)\\\\])*)\\)' + // 4: (title)
  ')?\\s*';

const LINK_REGEX = new RegExp(
  '^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)',
);

export const getLocalRules = (
  styles: MarkdownStyle,
  opts: MarkdownOptions = {},
): OutputRules<ReactOutputRule> => {
  const { onLink, paragraphNumberOfLines } = opts;
  const openLinkHandler = (target: string) => {
    if (onLink) {
      // user-supplied handler may be async; we keep the behavior
      Promise.resolve(onLink(target)).catch((error: unknown) => {
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
      content: parseInline(parse, capture[2] as string, state as MarkdownState),
    };
  };

  const parseFence: ParseFunction = (capture) => {
    // capture[2] = language string (may be undefined/empty)
    // capture[3] = code content
    let lang = (capture[2] || '').trim() || undefined;
    let content = capture[3] || '';

    // If we've found no lang on the fence line (the opening fence) but the first code line
    // is a lone token, treat it as lang and strip it from content. Helps with some specific
    // use-cases such as "```<newline>sql<newline>...".
    if (!lang) {
      const nl = content.indexOf('\n');
      const firstLine = (nl === -1 ? content : content.slice(0, nl)).trim();
      if (/^[A-Za-z0-9_+.-]+$/.test(firstLine)) {
        lang = firstLine;
        content = nl === -1 ? '' : content.slice(nl + 1);
      }
    }

    // Mirror your trimming behavior
    content = content.replace(/\n+$/, '');

    return { type: 'codeBlock', lang, content };
  };

  const enrichedRenderFunction =
    (
      render: RuleRenderFunction,
      options: Partial<RuleRenderFunctionEnrichedProps> = {},
    ) =>
    (
      node: SingleASTNode,
      output: Output<React.ReactNode>,
      { ...state }: MarkdownState,
    ) =>
      render({ node, output, state, styles, ...options });

  return {
    autolink: {
      react: enrichedRenderFunction(renderAutolink, {
        onLink: openLinkHandler,
      }),
    },
    blockQuote: {
      react: enrichedRenderFunction(renderBlockQuote),
    },
    br: {
      react: enrichedRenderFunction(renderLineBreak),
    },
    codeBlock: {
      react: enrichedRenderFunction(renderCodeBlock),
    },
    fence: {
      match: SimpleMarkdown.blockRegex(
        // 1: fence (``` or ~~~)
        // 2: info string (lang etc.) - SAME CAPTURE INDEX AS YOURS
        // 3: code content
        /^ {0,3}(`{3,}|~{3,})[ \t]*(\S+)?[ \t]*\r?\n([\s\S]*?)\r?\n?(?: {0,3})\1[ \t]*(?:\r?\n+|$)/,
      ),
      parse: parseFence,
    },
    del: {
      react: enrichedRenderFunction(renderStrikethrough),
    },
    em: {
      react: enrichedRenderFunction(renderEmphasis),
    },
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/),
      react: enrichedRenderFunction(renderHeading),
    },
    hr: {
      react: enrichedRenderFunction(renderHorizontalRule),
    },
    image: {
      // We intentionally disable parsing images; keep the shape
      match: () => null,
    },
    inlineCode: {
      parse: parseCaptureInline,
      react: enrichedRenderFunction(renderInlineCode),
    },
    link: {
      match: SimpleMarkdown.inlineRegex(LINK_REGEX) as MatchFunction,
      react: enrichedRenderFunction(renderLink, {
        onLink: openLinkHandler,
      }),
    },
    list: {
      react: enrichedRenderFunction(renderList),
    },
    mailto: {
      react: enrichedRenderFunction(renderMailto, {
        onLink: openLinkHandler,
      }),
    },
    newline: {
      react: enrichedRenderFunction(renderNewLine),
    },
    paragraph: {
      react: enrichedRenderFunction(renderParagraph, {
        paragraphNumberOfLines,
      }),
    },
    strong: {
      react: enrichedRenderFunction(renderBold),
    },
    sublist: {
      react: enrichedRenderFunction(renderList),
    },
    table: {
      react: enrichedRenderFunction(renderTable),
    },
    text: {
      react: enrichedRenderFunction(renderText),
    },
    u: {
      // no support for underlines yet
      match: () => null,
    },
    url: {
      react: enrichedRenderFunction(renderUrl, {
        onLink: openLinkHandler,
      }),
    },
    // no support for reflinks
    reflink: { match: () => null },
  } as unknown as OutputRules<ReactOutputRule>;
};
