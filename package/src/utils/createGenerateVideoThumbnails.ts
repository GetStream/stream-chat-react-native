export type GenerateVideoThumbnailResult = {
  error?: string | null;
  uri?: string | null;
};

export const createGenerateVideoThumbnails = ({
  createVideoThumbnails,
}: {
  createVideoThumbnails: (uris: string[]) => Promise<GenerateVideoThumbnailResult[]>;
}) => {
  return async (uris: string[]): Promise<Record<string, GenerateVideoThumbnailResult>> => {
    if (!uris.length) {
      return {};
    }

    const uniqueUris: string[] = [];
    const seenUris = new Set<string>();

    uris.forEach((uri) => {
      if (!seenUris.has(uri)) {
        seenUris.add(uri);
        uniqueUris.push(uri);
      }
    });

    const uniqueResults = await createVideoThumbnails(uniqueUris);

    return uniqueUris.reduce<Record<string, GenerateVideoThumbnailResult>>(
      (resultMap, uri, index) => {
        const result = uniqueResults[index] ?? {
          error: 'Thumbnail generation returned no result',
          uri: null,
        };

        if (result.error) {
          console.warn(`Failed to generate thumbnail for ${uri}: ${result.error}`);
        }

        resultMap[uri] = result;
        return resultMap;
      },
      {},
    );
  };
};
