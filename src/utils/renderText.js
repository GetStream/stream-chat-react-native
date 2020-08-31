import React from 'react';
import Markdown from '@stream-io/react-native-simple-markdown';
import anchorme from 'anchorme';
import truncate from 'lodash/truncate';

export const renderText = (message, styles, markdownRules) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  let { text } = message;
  const { mentioned_users = [] } = message;

  if (!text) {
    return;
  }
  text = text.trim();
  const urls = anchorme(text, {
    list: true,
  });
  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    text = text.replace(urlInfo.raw, mkdown);
  }
  let newText = text;
  if (mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  newText = newText.replace(/[<&"'>]/g, '\\$&');
  const markdownStyles = {
    ...defaultMarkdownStyles,
    ...styles,
  };

  return (
    <Markdown rules={markdownRules} styles={markdownStyles}>
      {newText}
    </Markdown>
  );
};

const defaultMarkdownStyles = {
  inlineCode: {
    backgroundColor: '#F3F3F3',
    borderColor: '#dddddd',
    color: 'red',
    fontSize: 13,
    padding: 3,
    paddingHorizontal: 5,
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  url: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
};
