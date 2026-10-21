import { getTrimmedAttachmentTitle } from '../getTrimmedAttachmentTitle';

describe('getTrimmedAttachmentTitle', () => {
  it('returns an empty string without a title', () => {
    expect(getTrimmedAttachmentTitle()).toBe('');
  });

  it('keeps a title that fits', () => {
    expect(getTrimmedAttachmentTitle('short.pdf')).toBe('short.pdf');
  });

  it('keeps the head and tail of a long title with the default length', () => {
    expect(getTrimmedAttachmentTitle('This is a very long title')).toBe('This is a...ong title');
  });

  it('keeps exactly maxLength characters for an odd maxLength', () => {
    expect(getTrimmedAttachmentTitle('abcdefghijklmnopqrst', 7)).toBe('abc...qrst');
  });
});
