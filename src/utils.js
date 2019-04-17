import anchorme from 'anchorme';
import React, { Component } from 'react';
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
