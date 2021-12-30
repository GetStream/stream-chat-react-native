const protocol = '[a-z][\\w\\.+-]+:\\/\\/';
const hostName = '[w]{3,}\\.';
const domainName = '[\\w_-]+((?:\\.[\\w_-]+)+)';
const path = '[\\w\\p{Letter}()$/\\._-]+';
const queryString = '\\?[\\w\\p{Letter}=&+~_-]+';
const fragment = '#[\\w\\p{Letter}#?=&+~_-]+';
const port = ':[\\d]{2,5}';
const emailAllowedCharacters = '[\\w+\\.~$_-]+';

/**
 * Don't match the following pattern if the previous string
 * matches `[anything](` as we don't want to interfere
 * with links that already have been formatted as markdown
 * */
const notWithinLink = `(?<!\\[.+\\]\\(.+)`;

/**
 * Match any email address, with and without `mailto:`
 * */
const emailPattern = `(?:mailto:)?(?<emailDisplay>(?:${emailAllowedCharacters})@(?:${domainName}))`;
/**
 * Match links decided by having a protocol, allows for example
 * https://localhost to be recognized as a link
 * */
const protocolPrefixedLinkPattern = `(?<pplProtocol>${protocol})(?<pplDisplay>${notWithinLink}(?:${path})?(?:${queryString})?(?:${fragment})?)`;
/**
 * Match as much as possible of a fqdn, at least with a domain name formed as
 * something.tld
 * */
const fqdnPattern = `(?<fqdnProtocol>${protocol})?(?:${hostName})?(?<fqdnDisplay>${notWithinLink}(?:${domainName})(?:${port})?(?:${path})?(?:${queryString})?(?:${fragment})?)`;

const linkRegexp = new RegExp(
  `${emailPattern}|${fqdnPattern}|${protocolPrefixedLinkPattern}`,
  'giu',
);

interface Link {
  encoded: string;
  protocol: string;
  raw: string;
}

export const parseUrlsFromText = (input: string): Link[] => {
  let matches;

  const results: Array<{
    encoded: string;
    protocol: string;
    raw: string;
  }> = [];

  while ((matches = linkRegexp.exec(input)) !== null) {
    results.push(extractFromMatchGroups(matches[0], matches.groups ?? {}));
  }

  return results;
};

/**
 * We can't use the same names for multiple groups in a regexp,
 * this helper accepts all group names and builds a `Link`
 * object from it.
 * */
const extractFromMatchGroups = (
  rawLink: string,
  {
    emailDisplay = null,
    fqdnDisplay = null,
    fqdnProtocol = null,
    pplDisplay = null,
    pplProtocol = null,
  },
): Link => {
  if (emailDisplay !== null) {
    return {
      encoded: encodeURI(emailDisplay),
      protocol: 'mailto:',
      raw: rawLink,
    };
  }

  return {
    encoded: encodeURI(fqdnDisplay ?? pplDisplay ?? ''),
    protocol: fqdnProtocol ?? pplProtocol ?? '',
    raw: rawLink,
  };
};
