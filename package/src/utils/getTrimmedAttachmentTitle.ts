import { lookup } from 'mime-types';

export const getTrimmedAttachmentTitle = (title?: string) => {
  if (!title) {
    return '';
  }

  const mimeType = lookup(title);
  if (mimeType) {
    const lastIndexOfDot = title.lastIndexOf('.');
    return title.length < 12 ? title : title.slice(0, 12) + '...' + title.slice(lastIndexOfDot);
  } else {
    // shorten title
    return title.length < 20 ? title : title.slice(0, 20) + '...';
  }
};
