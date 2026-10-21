import truncate from 'lodash/truncate';

import { parseLinksFromText } from './parseLinks';

import { escapeRegExp } from '../../../../utils/utils';

export const generateMarkdownText = (text?: string) => {
  if (!text) {
    return null;
  }

  const normalizedText = text.replace(/\uFFFC/g, ' ');

  let resultText = normalizedText.trim();

  const links = parseLinksFromText(resultText).map((linkInfo) => ({
    ...linkInfo,
    displayLink: truncate(linkInfo.raw, {
      length: 200,
      omission: '...',
    }),
  }));

  if (links.length > 0) {
    // Convert raw links and emails to markdown links in one pass, longest first, so a link that
    // contains another one (`getstream.io/chat` and `getstream.io`) is converted only once.
    // Eg: `getstream.io` -> `[getstream.io](http://getstream.io)`.
    const markdownByRaw = new Map(
      links.map(({ displayLink, raw, url }) => [raw, `[${displayLink}](${url})`]),
    );
    const linksRegEx = new RegExp(
      [...markdownByRaw.keys()]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
        .join('|'),
      'g',
    );
    resultText = resultText.replace(linksRegEx, (raw) => markdownByRaw.get(raw) ?? raw);
  }

  for (const { displayLink, url } of links) {
    // A mention whose name looks like a link or email is converted back to raw text.
    // Eg: `@[test.user@gmail.com](mailto:test.user@gmail.com)` -> `@test.user@gmail.com`.
    const mentionsRegex = new RegExp(
      `@\\[${escapeRegExp(displayLink)}\\]\\(${escapeRegExp(url)}\\)`,
      'g',
    );
    resultText = resultText.replace(mentionsRegex, `@${displayLink}`);
  }

  // Escape `<`, `"` and `'` outside of code spans and code blocks.
  resultText = resultText.replace(/(```[\s\S]*?```|`.*?`)|[<"']/g, (match, code) => {
    if (code) {
      return code;
    }
    return `\\${match}`;
  });

  // Remove 2 or more spaces right after a newline, except in code spans and code blocks.
  resultText = resultText.replace(/(```[\s\S]*?```|`.*?`)|\n[ ]{2,}/g, (_, code) => {
    if (code) {
      return code;
    }
    return '\n';
  });

  // A blank line before a code fence makes the markdown parser treat it as a separate block, which
  // keeps code blocks inside list items intact. The closing state is cleaned up in the rendering.
  resultText = resultText.replace(/\n```/g, '\n\n```');

  return resultText;
};
