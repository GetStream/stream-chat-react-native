type StreamConfig = {
  resizableCDNHosts: string[];
};
const DEFAULT_GLOBAL_STREAM_CONFIG = {
  resizableCDNHosts: ['.stream-io-cdn.com'],
};

export class StreamChatRN {
  static config: StreamConfig = DEFAULT_GLOBAL_STREAM_CONFIG;
  static setConfig(config: Partial<StreamConfig>) {
    this.config = { ...this.config, ...config };
  }
}
