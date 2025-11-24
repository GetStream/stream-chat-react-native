import { StateStore } from '@stream-io/state-store';

export type MediaAsset = {
  uri: string;
  width: number;
  height: number;
  name?: string;
  size?: number;
  type?: string;
};

export type MediaPickerState = {
  assets: MediaAsset[];
};

export type PickMediaOpts = { maxNumberOfFiles?: number };
export type PickMediaReturnType = {
  assets?: MediaAsset[];
  cancelled?: boolean;
  askToOpenSettings?: boolean;
};
export type PickMediaApi = (
  opts: PickMediaOpts,
) => Promise<PickMediaReturnType>;

export type TakeMediaOpts = { compressionQuality?: number };
export type TakeMediaReturnType = {
  asset?: MediaAsset;
  cancelled?: boolean;
  askToOpenSettings?: boolean;
};
export type TakeMediaApi = (
  opts: TakeMediaOpts,
) => Promise<TakeMediaReturnType>;

export abstract class AbstractMediaPickerService {
  public state: StateStore<MediaPickerState>;

  constructor() {
    this.state = new StateStore<MediaPickerState>({
      assets: [],
    });
  }

  abstract pickMedia: PickMediaApi;

  abstract takeMedia: TakeMediaApi;

  appendAssets = (assets: MediaAsset[]) => {
    this.state.next((prevState) => ({
      ...prevState,
      assets: [...prevState.assets, ...assets],
    }));
  };

  removeAsset = (index: number) => {
    this.state.next((prevState) => ({
      ...prevState,
      assets: prevState.assets.filter((_, i) => i !== index),
    }));
  };

  clearAssets = () => {
    this.state.partialNext({ assets: [] });
  };
}
