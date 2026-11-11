import React, { type ReactElement } from 'react';
import { Linking, Share, Text } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIAssistantMessage,
  type AIIcon,
  AIMessageAttachment,
  type AIMessageAttachmentProps,
  AIReplyActions,
  AIUserMessage,
  attachmentDetails,
  defaultAIIcons,
  formatFileSize,
  mergeThemes,
  parseMessageParts,
  StreamTheme,
} from '../index';
import { forgetCallStates } from '../message-parts/callStates';
import { setClipboardString } from '../services/clipboard-service';

// Each test's questions start unanswered, though tests reuse calls.
afterEach(forgetCallStates);

jest.mock('../services/clipboard-service', () => ({ setClipboardString: jest.fn() }));

const renderWithTheme = (ui: ReactElement) => render(<StreamTheme>{ui}</StreamTheme>);

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('formatFileSize', () => {
  it('writes three significant digits in the largest unit that fits', () => {
    expect(formatFileSize(0)).toBe('0.00 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2_453_000)).toBe('2.34 MB');
  });

  it('rounds a size just below the next unit instead of turning exponential', () => {
    expect(formatFileSize(1000)).toBe('1000 B');
    expect(formatFileSize(1023 * 1024)).toBe('1023 kB');
  });
});

describe('attachmentDetails', () => {
  it('joins the type and the size', () => {
    expect(attachmentDetails({ kind: 'file', name: 'report.pdf', size: 2_453_000 })).toBe(
      'PDF · 2.34 MB',
    );
  });

  it('takes the type from the URL, then the media type', () => {
    expect(attachmentDetails({ kind: 'file', url: 'https://x.io/a/notes.txt?v=1' })).toBe('TXT');
    expect(attachmentDetails({ kind: 'file', mimeType: 'image/svg+xml' })).toBe('SVG');
  });

  it('is empty with nothing to say', () => {
    expect(attachmentDetails({ kind: 'file' })).toBe('');
  });
});

describe('AIMessageAttachment', () => {
  it('shows an image as a thumbnail named for it, which does not open', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    renderWithTheme(
      <AIMessageAttachment attachment={{ kind: 'image', url: 'https://x.io/cat.png' }} />,
    );
    expect(screen.getByLabelText('cat.png')).toBeTruthy();
    expect(screen.queryByRole('imagebutton')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it('shows an image without a URL as a file', () => {
    renderWithTheme(<AIMessageAttachment attachment={{ kind: 'image', name: 'photo.png' }} />);
    expect(screen.getByText('photo.png')).toBeTruthy();
    expect(screen.getByText('PNG')).toBeTruthy();
  });

  it('shows a file with its name, type and size, and opens one at a web URL', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    renderWithTheme(
      <AIMessageAttachment
        attachment={{ kind: 'file', name: 'report.pdf', size: 2_453_000, url: 'https://x.io/r' }}
      />,
    );
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.getByText('PDF · 2.34 MB')).toBeTruthy();
    fireEvent.press(screen.getByRole('link'));
    expect(openURL).toHaveBeenCalledWith('https://x.io/r');
  });

  it("doesn't open anything but a web URL", () => {
    renderWithTheme(
      <AIMessageAttachment attachment={{ kind: 'file', name: 'x', url: 'javascript:alert(1)' }} />,
    );
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('names one without a name by its kind, and shows a kind it does not know as a file', () => {
    renderWithTheme(<AIMessageAttachment attachment={{ kind: 'image' }} />);
    expect(screen.getByText('Image')).toBeTruthy();
    renderWithTheme(<AIMessageAttachment attachment={{ kind: 'audio' }} />);
    expect(screen.getByText('File')).toBeTruthy();
  });
});

describe('AIUserMessage', () => {
  it('shows the text and the attachments', () => {
    renderWithTheme(
      <AIUserMessage attachments={[{ kind: 'file', name: 'a.pdf' }]} text='Summarise this' />,
    );
    expect(screen.getByText('Summarise this')).toBeTruthy();
    expect(screen.getByText('a.pdf')).toBeTruthy();
  });

  it('offers editing only with onEdit', () => {
    const onEdit = jest.fn();
    const { rerender } = renderWithTheme(<AIUserMessage text='Hi' />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    rerender(
      <StreamTheme>
        <AIUserMessage onEdit={onEdit} text='Hi' />
      </StreamTheme>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows no bubble for a message of attachments alone', () => {
    renderWithTheme(<AIUserMessage attachments={[{ kind: 'file', name: 'a.pdf' }]} text='' />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.getByText('a.pdf')).toBeTruthy();
  });
});

describe('AIAssistantMessage', () => {
  it('shows the steps, then the answer, then the attachments', () => {
    const parts = parseMessageParts([
      { id: 'r1', status: 'completed', summary: 'Looked it up', type: 'ai_reasoning' },
    ]);
    renderWithTheme(
      <AIAssistantMessage
        attachments={[{ kind: 'file', name: 'chart.csv' }]}
        parts={parts}
        text='The answer'
      />,
    );
    expect(screen.getByTestId('ai-message-parts')).toBeTruthy();
    expect(screen.getByText('The answer')).toBeTruthy();
    expect(screen.getByText('chart.csv')).toBeTruthy();
  });

  it('starts its steps afresh for another message, whose step ids may repeat', () => {
    // Every reply's first reasoning step can be `r1`: only the message tells them apart.
    const parts = parseMessageParts([
      { id: 'r1', status: 'completed', summary: 'Looked it up', type: 'ai_reasoning' },
    ]);
    const view = (id: string) => (
      <StreamTheme>
        <AIAssistantMessage
          id={id}
          parts={parts}
          reasoningText={() => 'The whole thought'}
          text='The answer'
        />
      </StreamTheme>
    );
    const { rerender } = render(view('a'));
    fireEvent.press(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('The whole thought')).toBeTruthy();

    rerender(view('a'));
    expect(screen.getByRole('button', { expanded: true })).toBeTruthy();

    // As when a list reuses the view for another reply.
    rerender(view('b'));
    expect(screen.getByRole('button', { expanded: false })).toBeTruthy();
    expect(screen.queryByText('The whole thought')).toBeNull();
  });

  it('is busy while the agent writes it', () => {
    renderWithTheme(<AIAssistantMessage isGenerating text='Partial' />);
    expect(screen.getByTestId('ai-assistant-message').props.accessibilityState).toEqual({
      busy: true,
    });
  });

  it('shows nothing of the answer before it has text', () => {
    renderWithTheme(<AIAssistantMessage text='' />);
    expect(screen.queryByTestId('ai-message-parts')).toBeNull();
  });
});

describe('AIReplyActions', () => {
  it('copies the text and shows it was copied for a moment', () => {
    jest.useFakeTimers();
    renderWithTheme(<AIReplyActions text='The answer' />);
    fireEvent.press(screen.getByRole('button', { name: 'Copy' }));
    expect(setClipboardString).toHaveBeenCalledWith('The answer');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('shares the text through the system share sheet', () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    renderWithTheme(<AIReplyActions text='The answer' />);
    fireEvent.press(screen.getByRole('button', { name: 'Share' }));
    expect(share).toHaveBeenCalledWith({ message: 'The answer' });
  });

  it('offers regenerating and rating only when given what they do', () => {
    renderWithTheme(<AIReplyActions text='x' />);
    expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Good response' })).toBeNull();
  });

  it('regenerates', () => {
    const onRegenerate = jest.fn();
    renderWithTheme(<AIReplyActions onRegenerate={onRegenerate} text='x' />);
    fireEvent.press(screen.getByRole('button', { name: 'Regenerate' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('rates, and takes a rating back', () => {
    const onRate = jest.fn();
    const { rerender } = renderWithTheme(<AIReplyActions onRate={onRate} text='x' />);
    fireEvent.press(screen.getByRole('button', { name: 'Bad response' }));
    expect(onRate).toHaveBeenLastCalledWith('negative');

    rerender(
      <StreamTheme>
        <AIReplyActions onRate={onRate} rating='positive' text='x' />
      </StreamTheme>,
    );
    const good = screen.getByRole('button', { name: 'Good response' });
    expect(good.props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(good);
    expect(onRate).toHaveBeenLastCalledWith(null);
  });
});

const iconNamed =
  (name: string): AIIcon =>
  () => <Text>{`icon:${name}`}</Text>;

describe('icons', () => {
  it('draws with the theme’s icons over the defaults', () => {
    render(
      <StreamTheme style={{ icons: { Copy: iconNamed('Copy'), Share: iconNamed('Share') } }}>
        <AIReplyActions onRate={jest.fn()} text='x' />
      </StreamTheme>,
    );
    expect(screen.getByText('icon:Copy')).toBeTruthy();
    expect(screen.getByText('icon:Share')).toBeTruthy();
    expect(screen.queryByText('icon:ThumbsUp')).toBeNull();
  });

  it('keeps icons as they are when themes merge', () => {
    const Copy = iconNamed('Copy');
    const Share = iconNamed('Share');
    const theme = mergeThemes({ style: { icons: { Copy } } });
    expect(theme.icons?.Copy).toBe(Copy);
    const merged = mergeThemes({ style: { icons: { Share } }, theme });
    expect(merged.icons).toEqual({ Copy, Share });
    expect(merged.colors).toEqual(theme.colors);
  });

  it.each([
    [{ kind: 'file', name: 'report.pdf' }, 'Pdf'],
    [{ kind: 'file', mimeType: 'application/pdf', name: 'report' }, 'Pdf'],
    [{ kind: 'file', name: 'song.mp3' }, 'Audio'],
    [{ kind: 'file', mimeType: 'video/mp4', name: 'clip' }, 'Video'],
    [{ kind: 'file', name: 'backup.zip' }, 'Archive'],
    [{ kind: 'file', mimeType: 'application/vnd.rar', name: 'x' }, 'Archive'],
    [{ kind: 'image', name: 'photo' }, 'Image'],
    [{ kind: 'file', name: 'notes.txt' }, 'File'],
  ])('gives a file of %o the %s icon', (attachment, icon) => {
    const icons = Object.fromEntries(
      Object.keys(defaultAIIcons).map((name) => [name, iconNamed(name)]),
    );
    render(
      <StreamTheme style={{ icons }}>
        <AIMessageAttachment attachment={attachment} />
      </StreamTheme>,
    );
    expect(screen.getByText(`icon:${icon}`)).toBeTruthy();
  });
});

describe('Attachment slot', () => {
  const Mine = ({ attachment, role }: AIMessageAttachmentProps) => (
    <Text>{`mine:${role}:${attachment.name}`}</Text>
  );

  it('shows the person’s attachments with a view of your own', () => {
    renderWithTheme(
      <AIUserMessage Attachment={Mine} attachments={[{ kind: 'file', name: 'a.pdf' }]} text='' />,
    );
    expect(screen.getByText('mine:user:a.pdf')).toBeTruthy();
  });

  it('shows the agent’s attachments with a view of your own', () => {
    renderWithTheme(
      <AIAssistantMessage
        Attachment={Mine}
        attachments={[{ kind: 'file', name: 'b.csv' }]}
        text='x'
      />,
    );
    expect(screen.getByText('mine:assistant:b.csv')).toBeTruthy();
  });
});
