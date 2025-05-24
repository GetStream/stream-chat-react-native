// Add dots in between the title if it is too long and then append the remaining last characters.
// Eg: "This is a very long title" => "This is a very long ti...le"
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
