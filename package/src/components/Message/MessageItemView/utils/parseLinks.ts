import { find } from 'linkifyjs';

interface LinkInfo {
  raw: string;
  url: string;
}

/** Strips markdown links such as `[Google](https://www.google.com)`, so they are not linkified again. */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[.*\]\(.*\)/g, '');

/** Strips `@user.name@domain.tld` mentions, so a username with a dot is not parsed as a link. */
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
    // Values that already carry a scheme (`mailto:`, `tel:`, `sms:` or `scheme://`) are kept as is.
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
