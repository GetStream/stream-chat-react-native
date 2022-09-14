/**
 * 📣 Note: Do not use named capture groups, as
 *          it is not yet available in Hermes.
 *
 * These helpers indend to make it easier to skim read
 * the patterns below, but note that some are optional,
 * specified in the patterns these are added to.
 * */
const emailUserName = '[\\w+\\.~$_-]+';
const schema = `(\\w{2,15}:\\/\\/)`;
// something.tld OR 123.123.123.123
const userName = '^@\\w+\\.?\\w*';
const domain = `((?:\\w+\\.[a-zA-Z]+(?<!${userName}))+(?:[^:\\/\\s]+)|(?:\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}))`;
const port = `(:[0-9]{1,5})`;
const path = `((?:\\/)?[^?\\s]+)`;
const queryString = `(\\?[^#\\s]+)`;
const fragment = `(#[\\w_-]+)`;

/**
 * Match any email address, with and without `mailto:`
 */
const emailPattern = `(mailto:)?((?:${emailUserName})@(?:${domain}))`;

/**
 * Match any string starting with something that seems like it's a schema.
 * */
const schemePrefixedLinkPattern = `${schema}(\\S+)`;

/**
 * Match as much as possible of a fqdn, at least with a domain name formed as
 * something.tld
 */
const fqdnLinkPattern = `${schema}?${domain}${port}?${path}?${queryString}?${fragment}?`;

interface Link {
  encoded: string;
  raw: string;
  scheme: string;
}

/**
 * This is done separately because of the version of javascript run
 * for expo
 * */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[[\w\s]+\]\(.*\)/g, '');

export const parseLinksFromText = (input: string): Link[] => {
  let matches;

  const inputWithoutMarkdownLinks = removeMarkdownLinksFromText(input);

  const results: Link[] = [];

  const emailRegExp = new RegExp(emailPattern, 'gi');
  while ((matches = emailRegExp.exec(input)) !== null) {
    const [raw, scheme = 'mailto:', displayValue] = matches;
    results.push({ encoded: encodeURI(displayValue), raw, scheme });
  }

  /**
   * The two link patterns are checked with an "or" (`|`)
   * to avoid overlapping matches being duplicated in the output.
   * */
  const linkRegex = new RegExp(`${fqdnLinkPattern}|${schemePrefixedLinkPattern}`, 'gi');
  while ((matches = linkRegex.exec(inputWithoutMarkdownLinks)) !== null) {
    const [
      raw,
      fqdnScheme = '',
      fqdnDomainName = '',
      fqdnPort = '',
      fqdnPath = '',
      fqdnQueryStraing = '',
      fqdnFragment = '',
      schemePrefixedScheme = '',
      schemePrefixedPath = '',
    ] = matches;

    if (schemePrefixedScheme !== '') {
      results.push({
        encoded: encodeURI(schemePrefixedPath),
        raw,
        scheme: schemePrefixedScheme,
      });
      continue;
    }

    results.push({
      encoded: encodeURI(
        [fqdnDomainName, fqdnPort, fqdnPath, fqdnQueryStraing, fqdnFragment].join(''),
      ),
      raw,
      scheme: fqdnScheme,
    });
  }

  return results;
};
