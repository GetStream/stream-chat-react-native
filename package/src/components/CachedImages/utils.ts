export const extractPathname = (uri: string | undefined) => {
  const parsedUrl = uri?.split('?')?.[0];
  // Extracts pathname. Need to use a regex cause url.parse is deprecated and RN doesnt have
  // URL constructor. Replace / with ___ to avoid creating folders
  return parsedUrl?.replace(/(https?:\/\/)?/, '').replace(/\//g, '___');
};
