import React from 'react';
import PropTypes from 'prop-types';
import { TagObject, TagProps } from 'react-docgen';
import map from 'lodash/map';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';

const plural = (array: TagObject[], caption: string) =>
  array.length === 1 ? caption : `${caption}s`;
const list = (array: TagObject[]) => array.map((item) => item.description).join(', ');
const paragraphs = (array: TagObject[]) => array.map((item) => item.description).join('\n\n');

const fields = {
  author: (value: TagObject[]) => `${plural(value, 'Author')}: ${list(value)}`,
  default: (value: TagObject[]) => `**Default**: ${value[0].default}`,
  deprecated: (value: TagObject[]) => `**Deprecated:** ${value[0].description}`,
  link: (value: TagObject[]) => paragraphs(value),
  see: (value: TagObject[]) => paragraphs(value),
  since: (value: TagObject[]) => `Since: ${value[0].description}`,
  version: (value: TagObject[]) => `Version: ${value[0].description}`,
};

export function getMarkdown(props: TagProps) {
  return map(fields, (format: (value: TagObject[]) => string, field: keyof TagProps) => {
    const tag = props[field];
    return tag && format(tag);
  })
    .filter(Boolean)
    .join('\n\n');
}

export default function JsDoc(props: TagProps) {
  const markdown = getMarkdown(props);
  return markdown ? <Markdown text={markdown} /> : null;
}

JsDoc.propTypes = {
  author: PropTypes.array,
  deprecated: PropTypes.array,
  link: PropTypes.array,
  see: PropTypes.array,
  since: PropTypes.array,
  version: PropTypes.array,
};
