import anchorme from 'anchorme';
import { truncate } from 'lodash-es';

export const renderText = (text) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) {
    return;
  }

  const urls = anchorme(text, {
    list: true,
  });
  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    text = message.replace(urlInfo.raw, mkdown);
  }

  return (
    <ReactMarkdown
      allowedTypes={allowed}
      source={message}
      linkTarget="_blank"
      plugins={[]}
      escapeHtml={true}
      skipHtml={false}
    />
  );
};
