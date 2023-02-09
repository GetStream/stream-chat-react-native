import Linkify from 'linkify-it';

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

  const linkify = Linkify();
  const matches = linkify.match(strippedInput) ?? [];

  const result: LinkInfo[] = matches.map((match) => {
    const { raw, url } = match;
    return { encodedUrl: encodeURI(url), raw };
  });

  return result;
};
