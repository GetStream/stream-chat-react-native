import { type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import type { ConfigPluginProps } from './index';

const withStreamAndroidManifest: ConfigPlugin<ConfigPluginProps> = (
  configuration,
  _props,
) => {
  return withAndroidManifest(configuration, (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];

    const hasRecordAudio = permissions.some(
      (item) => item.$?.['android:name'] === 'android.permission.RECORD_AUDIO',
    );

    if (!hasRecordAudio) {
      permissions.push({
        $: {
          'android:name': 'android.permission.RECORD_AUDIO',
        },
      });
    }

    return config;
  });
};

export default withStreamAndroidManifest;
