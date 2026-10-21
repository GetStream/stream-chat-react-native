import { StateStore } from '@stream-io/state-store';
import { Channel } from 'stream-chat';

import { useStateStore } from '../hooks/useStateStore';
import type { File } from '../types/types';

export type EditChannelImagePendingAction = 'camera' | 'library' | 'reset';

export type EditChannelDetailsState = {
  /** Current value of the name input. */
  currentName: string;
  /** Channel image URL snapshotted at construction; WebSocket events do not update it. */
  initialImage: string | undefined;
  /** Channel name snapshotted at construction; WebSocket events do not update it. */
  initialName: string;
  /** Pending action from the {@link ChannelEditImageSheet}, or `null` when idle. */
  pendingAction: EditChannelImagePendingAction | null;
  /** `undefined` = untouched, `File` = newly picked, `null` = reset. */
  updatedImage: File | null | undefined;
};

/**
 * Holds the editable state of the channel details form (name and image) plus the pending
 * image-picker action. The channel's name and image are snapshotted at construction, so a
 * `channel.updated` event does not overwrite in-progress edits.
 */
export class EditChannelDetailsStore {
  public state: StateStore<EditChannelDetailsState>;

  constructor(channel: Channel) {
    const initialName = channel.data?.custom?.name ?? '';
    const initialImage = channel.data?.custom?.image;

    this.state = new StateStore<EditChannelDetailsState>({
      currentName: initialName,
      initialImage,
      initialName,
      pendingAction: null,
      updatedImage: undefined,
    });
  }

  /**
   * Updates the current value of the name input.
   *
   * @param currentName The new name input value.
   */
  setCurrentName(currentName: string) {
    this.state.partialNext({ currentName });
  }

  /**
   * Updates the picked image.
   *
   * @param updatedImage `undefined` when untouched, a `File` when newly picked, `null` for reset.
   */
  setUpdatedImage(updatedImage: File | null | undefined) {
    this.state.partialNext({ updatedImage });
  }

  /**
   * Sets the pending image-picker action.
   *
   * @param pendingAction The action to run, or `null` to clear it.
   */
  setPendingAction(pendingAction: EditChannelImagePendingAction | null) {
    this.state.partialNext({ pendingAction });
  }
}

/**
 * Whether the name input differs from the channel's initial name.
 *
 * @param state The store state.
 * @returns True when the name was edited.
 */
export const isNameEdited = (state: EditChannelDetailsState) =>
  state.currentName !== state.initialName;

/**
 * Whether the image has unsaved changes: it was touched and the result is not "no image before and
 * none now".
 *
 * @param state The store state.
 * @returns True when the image was edited.
 */
export const isImageEdited = (state: EditChannelDetailsState) =>
  !(state.updatedImage === undefined || (!state.updatedImage && !state.initialImage));

const selectIsNameEdited = (state: EditChannelDetailsState) => ({
  isNameEdited: isNameEdited(state),
});

const selectIsImageEdited = (state: EditChannelDetailsState) => ({
  isImageEdited: isImageEdited(state),
});

const selectAreChannelDetailsEdited = (state: EditChannelDetailsState) => ({
  areChannelDetailsEdited: isNameEdited(state) || isImageEdited(state),
});

/**
 * Subscribes to the store and returns whether the name input has unsaved changes.
 *
 * @param store The store to subscribe to.
 * @returns True when the name was edited.
 */
export const useIsNameEdited = (store: EditChannelDetailsStore) =>
  useStateStore(store.state, selectIsNameEdited).isNameEdited;

/**
 * Subscribes to the store and returns whether the image has unsaved changes.
 *
 * @param store The store to subscribe to.
 * @returns True when the image was edited.
 */
export const useIsImageEdited = (store: EditChannelDetailsStore) =>
  useStateStore(store.state, selectIsImageEdited).isImageEdited;

/**
 * Subscribes to the store and returns whether the name or the image has unsaved changes.
 *
 * @param store The store to subscribe to.
 * @returns True when either was edited.
 */
export const useAreChannelDetailsEdited = (store: EditChannelDetailsStore) =>
  useStateStore(store.state, selectAreChannelDetailsEdited).areChannelDetailsEdited;
