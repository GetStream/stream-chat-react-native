import { find } from 'linkifyjs';

interface LinkInfo {
  raw: string;
  url: string;
}

/**
 * This is done to remove all markdown formatted links.
 * eg: [google.com](https://www.google.com), [Google](https://www.google.com), [https://www.google.com](https://www.google.com)
 * */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[.*\]\(.*\)/g, '');

/**
 * This is done to avoid parsing usernames with dot as well as an email address in it.
 */
const removeUserNamesWithEmailFromText = (input: string) =>
  input.replace(/@(\w+(\.\w+)?)(@\w+\.\w+)/g, '');

export const parseLinksFromText = (input?: string): LinkInfo[] => {
  if (!input) {
    return [];
  }
  const strippedInput = [removeMarkdownLinksFromText, removeUserNamesWithEmailFromText].reduce(
    (acc, fn) => fn(acc),
    input,
  );

  const links = find(strippedInput, 'url');
  const emails = find(strippedInput, 'email');

  const result: LinkInfo[] = [...links, ...emails].map(({ href, value }) => {
    let hrefWithProtocol = href;
    // Matching these: https://reactnative.dev/docs/0.73/linking?syntax=ios#built-in-url-schemes
    const pattern = new RegExp(/^(mailto:|tel:|sms:|\S+:\/\/)/);
    if (!pattern.test(hrefWithProtocol)) {
      hrefWithProtocol = 'http://' + hrefWithProtocol;
    }

    return {
      raw: value,
      url: hrefWithProtocol,
    };
  });

  return result;
};
