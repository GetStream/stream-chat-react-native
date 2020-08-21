import React from 'react';
import Markdown from '@stream-io/react-native-simple-markdown';
import anchorme from 'anchorme';
import truncate from 'lodash/truncate';

export const renderText = ({ markdownRules, markdownStyles, message }) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  const { mentioned_users = [], text } = message;

  if (!text) {
    return null;
  }

  let newText = text.trim();
  const urls = anchorme(newText, {
    list: true,
  });

  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    newText = newText.replace(urlInfo.raw, mkdown);
  }

  if (mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  newText = newText.replace(/[<&"'>]/g, '\\$&');
  const styles = {
    ...defaultMarkdownStyles,
    ...markdownStyles,
  };

  return (
    <Markdown rules={markdownRules} styles={styles}>
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
