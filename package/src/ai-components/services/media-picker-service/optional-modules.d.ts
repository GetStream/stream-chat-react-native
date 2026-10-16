// The image picker libraries are optional peer dependencies (`react-native-image-picker` for React
// Native CLI apps, `expo-image-picker` for Expo apps) and are not installed in this package. Only
// the asset shapes the media picker services read are declared here.

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
