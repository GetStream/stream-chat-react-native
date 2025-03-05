import 'stream-chat';
import { DefaultAttachmentType, DefaultMessageType } from 'stream-chat-react-native';

declare module 'stream-chat' {
  // TODO: Check why does this not come automatically ?
  interface CustomUserData {
    image?: string;
  }

  interface CustomAttachmentData extends DefaultAttachmentType {
    id?: string;
  }

  interface CustomMessageData extends DefaultMessageType {
    ai_generated?: boolean;
  }
}
