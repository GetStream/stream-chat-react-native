type StreamConfig = {
  resizableCDNHosts: string[];
};
const DEFAULT_GLOBAL_STREAM_CONFIG = {
  resizableCDNHosts: ['.stream-io-cdn.com'],
};

/**
 * StreamChatRN - Global config for the RN Chat SDK
 * This config is used to enable/disable features and options for the SDK.
 *
 * @deprecated Use the `resizableCDNHosts` prop in the `Chat` component, instead. StreamChatRN will not be exposed starting the next major release.
 */
export class StreamChatRN {
  /**
   * Global config for StreamChatRN.
   */
  static config: StreamConfig = DEFAULT_GLOBAL_STREAM_CONFIG;
  /**
   * Set global config for StreamChatRN allows you to set wished CDN hosts for resizing images.
   * This function accepts an config object that will be merged with the default config.
   * @example StreamChatRN.setConfig({ resizableCDNHosts: ['my-custom-cdn.com', 'my-other-cdn.com'] });
   */
  static setConfig(config: Partial<StreamConfig>) {
    this.config = { ...this.config, ...config };
  }
}
