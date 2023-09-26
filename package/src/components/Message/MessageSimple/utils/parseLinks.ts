import { find } from 'linkifyjs';

interface LinkInfo {
  encodedUrl: string;
  raw: string;
}

/**
 * This is done separately because of the version of javascript run
 * for expo
 * */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[[\w\s]+\]\(.*\)/g, '');

/**
 * Hermes doesn't support lookbehind, so this is done separately to avoid
 * parsing user names as links.
 * */
const removeUserNamesFromText = (input: string) => input.replace(/^@\w+\.?\w/, '');

export const parseLinksFromText = (input: string): LinkInfo[] => {
  const strippedInput = [removeMarkdownLinksFromText, removeUserNamesFromText].reduce(
    (acc, fn) => fn(acc),
    input,
  );

  const links = find(strippedInput, 'url');
  const emails = find(strippedInput, 'email');

  const result: LinkInfo[] = [...links, ...emails].map(({ href, value }) => ({
    encodedUrl: encodeURI(href),
    raw: value,
  }));

  return result;
};
