// Optional peer dependencies that are not installed in this package: `react-native-image-picker`
// (React Native CLI) and `expo-image-picker` (Expo). Only the asset shapes the media picker
// services read are declared.

declare module 'react-native-image-picker' {
  export type Asset = {
    fileName?: string;
    fileSize?: number;
    height?: number;
    type?: string;
    uri?: string;
    width?: number;
  };
}

declare module 'expo-image-picker' {
  export type ImagePickerAsset = {
    fileName?: string | null;
    fileSize?: number;
    height: number;
    mimeType?: string;
    uri: string;
    width: number;
  };
}
