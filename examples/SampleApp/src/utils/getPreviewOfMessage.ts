import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';
import { FileTypes, TranslationContextValue } from 'stream-chat-react-native';

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

export const getPreviewFromMessage = ({
  t,
  message,
}: {
  t: TranslationContextValue['t'];
  message: MessageResponse | LocalMessage | DraftMessage;
}) => {
  if (message.attachments?.length) {
    const attachment = message?.attachments?.at(0);

    const attachmentIcon = attachment
      ? `${
          attachmentTypeIconMap[
            (attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'
          ] ?? attachmentTypeIconMap.file
        } `
      : '';

    if (attachment?.type === FileTypes.VoiceRecording) {
      return [
        { bold: false, text: attachmentIcon },
        {
          bold: false,
          text: t('Voice message'),
        },
      ];
    }
    return [
      { bold: false, text: attachmentIcon },
      {
        bold: false,
        text:
          attachment?.type === FileTypes.Image
            ? attachment?.fallback
              ? attachment?.fallback
              : 'N/A'
            : attachment?.title
              ? attachment?.title
              : 'N/A',
      },
    ];
  }

  if (message.poll_id) {
    return [
      {
        bold: false,
        text: '📊',
      },
      {
        bold: false,
        text: 'Poll',
      },
    ];
  }

  return [
    {
      bold: false,
      text: message.text ?? '',
    },
  ];
};
