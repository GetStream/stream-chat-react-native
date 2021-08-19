import { useEffect, useState } from 'react';

import {
  checkIfLocalAttachment,
  getStreamChannelMessageAttachmentDir,
  saveAttachment,
} from '../../StreamMediaCache';

import type { ImageURISource } from 'react-native';

type GalleryImageCacheConfig = {
  channelId: string | undefined;
  messageId: string | undefined;
};

export const getAttachmentId = (uri: string | undefined) => {
  const parsedUrl = uri?.split('?')?.[0];
  return parsedUrl?.split(/(images|media)\//)[2];
};

const useCachedAttachment = (config: {
  cacheConfig: GalleryImageCacheConfig;
  source: ImageURISource;
}) => {
  const [cachedSource, setCachedSource] = useState({
    ...config.source,
    uri: '',
  });

  const setCachedSourceIfExists = async () => {
    const { channelId, messageId } = config.cacheConfig;
    const attachmentId = getAttachmentId(config.source.uri);

    if (!messageId || !config.source.uri || !channelId || !attachmentId) {
      return setCachedSource((src) => ({
        ...src,
        uri: config.source.uri as string,
      }));
    }

    if (!(await checkIfLocalAttachment(channelId, messageId, attachmentId))) {
      await saveAttachment(channelId, messageId, attachmentId, config.source.uri as string);
    }

    return setCachedSource((src) => ({
      ...src,
      uri: `file://${getStreamChannelMessageAttachmentDir(channelId, messageId, attachmentId)}`,
    }));
  };

  useEffect(() => {
    setCachedSourceIfExists();
  }, []);

  return cachedSource;
};

export default useCachedAttachment;
