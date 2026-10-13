import { MediaPickerService as ExpoMediaPickerService } from './expo';
import { MediaPickerService as RNCLIMediaPickerService } from './rncli';

export const MediaPickerService =
  RNCLIMediaPickerService ?? ExpoMediaPickerService;
