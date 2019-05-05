import anchorme from 'anchorme';
import React from 'react';
import { truncate } from 'lodash-es';
import { HyperLink } from './components/HyperLink';

export const renderText = (text) => {
  if (!text) {
    return;
  }

  const tokens = text.split(' ');
  const rendered = [];

  for (let i = 0; i < tokens.length; i++) {
    // console.log();
    if (anchorme.validate.url(tokens[i])) {
      const urlInfo = anchorme(tokens[i], { list: true })[0];
      const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
        length: 20,
        omission: '...',
      });
      rendered.push(
        <HyperLink
          url={urlInfo.protocol + urlInfo.encoded}
          title={displayLink}
          key={`link-${i}-${urlInfo.encoded}`}
        />,
        ' ',
      );
    } else {
      rendered.push(tokens[i] + ' ');
    }
  }
  return rendered;
};

export const emojiData = [
  {
    id: 'haha',
    icon: '😀',
  },
  {
    id: 'love',
    icon: '😍',
  },
  {
    id: 'sad',
    icon: '😥',
  },
  {
    id: 'wow',
    icon: '😳',
  },
  {
    id: 'like',
    icon: '👍',
  },
];

export const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const FileState = Object.freeze({
  NO_FILE: 'no_file',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  UPLOAD_FAILED: 'upload_failed',
});

export const ProgressIndicatorTypes = Object.freeze({
  IN_PROGRESS: 'in_progress',
  RETRY: 'retry',
});
