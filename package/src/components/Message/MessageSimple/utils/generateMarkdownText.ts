import truncate from 'lodash/truncate';

import { parseLinksFromText } from './parseLinks';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import type { MessageType } from '../../../MessageList/hooks/useMessageList';

export const generateMarkdownText = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics>,
) => {
  const { text } = message;

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
    // Eg: Hi getstream.io -> Hi [getstream.io](getstream.io).
    const normalRegEx = new RegExp(linkInfo.raw, 'g');
    const markdown = `[${displayLink}](${linkInfo.encodedUrl})`;
    resultText = text.replace(normalRegEx, markdown);

    // After previous step, in some cases, the mentioned user after `@` might have a link/email so we convert it back to normal raw text.
    // Eg: Hi, @[test.user@gmail.com](mailto:test.user@gmail.com) to @test.user@gmail.com.
    const mentionsRegex = new RegExp(`@\\[${displayLink}\\]\\(${linkInfo.encodedUrl}\\)`, 'g');
    resultText = resultText.replace(mentionsRegex, `@${displayLink}`);
  }

  resultText = resultText.replace(/[<&"'>]/g, '\\$&');

  return resultText;
};
