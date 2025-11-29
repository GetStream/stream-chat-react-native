import { setClipboardString as expoSetClipboardString } from './expo';
import { setClipboardString as rncliSetClipboardString } from './rncli';

export const setClipboardString =
  rncliSetClipboardString ?? expoSetClipboardString;
