// Shortens a title longer than `maxLength` (default 18) to `maxLength` characters, its head and tail
// joined by an ellipsis: "This is a very long title" => "This is a...ong title". An odd
// `maxLength` gives the tail the extra character.
export const getTrimmedAttachmentTitle = (title?: string, maxLength?: number) => {
  const maxLengthValue = maxLength || 18;
  if (!title) return '';

  const ellipsis = '...';

  if (title.length <= maxLengthValue) {
    return title;
  }

  const headLength = Math.floor(maxLengthValue / 2);
  const tailLength = maxLengthValue - headLength;
  const start = title.slice(0, headLength);
  const end = title.slice(title.length - tailLength);

  return `${start}${ellipsis}${end}`;
};
