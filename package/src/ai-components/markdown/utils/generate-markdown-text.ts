import { find } from 'linkifyjs';
import truncate from 'lodash/truncate';

import type { LinkInfo } from '../index';

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

/** Removes markdown links such as `[Google](https://www.google.com)` from `input`. */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[.*\]\(.*\)/g, '');

/** Removes `@name@domain.tld` mentions so a username with an email is not parsed as a link. */
const removeUserNamesWithEmailFromText = (input: string) =>
  input.replace(/@(\w+(\.\w+)?)(@\w+\.\w+)/g, '');

export const parseLinksFromText = (input?: string): LinkInfo[] => {
  if (!input) {
    return [];
  }
  const strippedInput = [removeMarkdownLinksFromText, removeUserNamesWithEmailFromText].reduce(
    (acc, fn) => fn(acc),
    input,
  );

  const links = find(strippedInput, 'url');
  const emails = find(strippedInput, 'email');

  const result: LinkInfo[] = [...links, ...emails].map(({ href, value }) => {
    let hrefWithProtocol = href;
    // Hrefs without a built-in scheme get `http://`:
    // https://reactnative.dev/docs/0.73/linking?syntax=ios#built-in-url-schemes
    const pattern = new RegExp(/^(mailto:|tel:|sms:|\S+:\/\/)/);
    if (!pattern.test(hrefWithProtocol)) {
      hrefWithProtocol = 'http://' + hrefWithProtocol;
    }

    return {
      raw: value,
      url: hrefWithProtocol,
    };
  });

  return result;
};

export const generateMarkdownText = (text?: string) => {
  if (!text) {
    return null;
  }

  let resultText = text;

  const linkInfos = parseLinksFromText(resultText);

  for (const linkInfo of linkInfos) {
    const displayLink = truncate(linkInfo.raw, {
      length: 200,
      omission: '...',
    });
    // Wrap each raw link or email in markdown link syntax.
    const normalRegEx = new RegExp(escapeRegExp(linkInfo.raw), 'g');
    const markdown = `[${displayLink}](${linkInfo.url})`;
    resultText = resultText.replace(normalRegEx, markdown);

    // Undo it for a link right after `@`, so a mention stays plain text:
    // `@[test.user@gmail.com](mailto:test.user@gmail.com)` becomes `@test.user@gmail.com`.
    const mentionsRegex = new RegExp(
      `@\\[${escapeRegExp(displayLink)}\\]\\(${escapeRegExp(linkInfo.url)}\\)`,
      'g',
    );
    resultText = resultText.replace(mentionsRegex, `@${displayLink}`);
  }

  // Collapses indentation after a newline, except in code and before a list item (a `-`, `*`, `+`
  // or `1.` marker followed by a space, at any nesting depth, optionally quoted with `>`).
  const LIST_START_RE = /^[ \t]*(?:> ?)*?(?:[*+-]|\d+\.)(?: |\t)(?:\[(?: |x|X)\] )?/;

  resultText = resultText.replace(
    // 1) fenced code blocks (``` <some code here> ```)
    // 2) inline code (`…`)
    // 3) newline followed by 2 or more spaces/tabs
    /(```[\s\S]*?```|`[^`]*?`)|\n([ \t]{2,})/g,
    (match, code, spaces, offset, full) => {
      // Code spans and fences are returned untouched.
      if (code) return code;

      const after = full.slice(offset + match.length);

      return LIST_START_RE.test(after) ? `\n${spaces}` : '\n';
    },
  );

  // A blank line before each fence makes the parser treat it as a separate block, which code blocks
  // inside list items need. The renderer cleans up the closing state of the code block.
  resultText = resultText.replace(/\n```/g, '\n\n```\n');

  const codeBlockCounts = (resultText.match(/```/g) || []).length;
  if (codeBlockCounts % 2 > 0) {
    resultText += '```';
  }

  return resultText;
};
