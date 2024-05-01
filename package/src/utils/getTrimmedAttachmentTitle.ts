export const getTrimmedAttachmentTitle = (title?: string) => {
  if (!title) return '';
  const lastIndexOfDot = title.lastIndexOf('.');
  return title.length < 12 ? title : title.slice(0, 12) + '...' + title.slice(lastIndexOfDot);
};
