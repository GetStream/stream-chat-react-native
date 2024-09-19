import truncate from 'lodash/truncate';

import { parseLinksFromText } from './parseLinks';

import { escapeRegExp } from '../../../../utils/utils';

export const generateMarkdownText = (text?: string) => {
  if (!text) return null;

  // Trim the extra spaces from the text.
  let resultText = text.trim();

  // List of all the links present in the text.
  const linkInfos = parseLinksFromText(resultText);

  for (const linkInfo of linkInfos) {
    const displayLink = truncate(linkInfo.raw, {
      length: 200,
      omission: '...',
    });
    // Convert raw links/emails in the text to respective markdown syntax.
    // Eg: Hi @getstream.io -> Hi @[getstream.io](getstream.io).
    const normalRegEx = new RegExp(escapeRegExp(linkInfo.raw), 'g');
    const markdown = `[${displayLink}](${linkInfo.url})`;
    resultText = text.replace(normalRegEx, markdown);

    // After previous step, in some cases, the mentioned user after `@` might have a link/email so we convert it back to normal raw text.
    // Eg: Hi, @[test.user@gmail.com](mailto:test.user@gmail.com) to @test.user@gmail.com.
    const mentionsRegex = new RegExp(
      `@\\[${escapeRegExp(displayLink)}\\]\\(${escapeRegExp(linkInfo.url)}\\)`,
      'g',
    );
    resultText = resultText.replace(mentionsRegex, `@${displayLink}`);
  }

  resultText = resultText.replace(/[<"'>]/g, '\\$&');

  return resultText;
};
