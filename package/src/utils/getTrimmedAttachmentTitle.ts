// Shortens a title longer than `maxLength` (default 18) to its first and last `maxLength / 2`
// characters joined by an ellipsis: "This is a very long title" => "This is a...ong title".
export const getTrimmedAttachmentTitle = (title?: string, maxLength?: number) => {
  const maxLengthValue = maxLength || 18;
  if (!title) return '';

  const ellipsis = '...';

  if (title.length <= maxLengthValue) {
    return title;
  }

  const start = title.slice(0, maxLengthValue / 2);
  const end = title.slice(title.length - maxLengthValue / 2);

  return `${start}${ellipsis}${end}`;
};
