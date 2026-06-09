import { Channel, StateStore } from 'stream-chat';

import { useStateStore } from '../hooks/useStateStore';
import type { File } from '../types/types';

export type EditChannelImagePendingAction = 'camera' | 'library' | 'reset';

export type EditChannelDetailsState = {
  /** Current value of the name input. */
  currentName: string;
  /**
   * Channel image URL snapshotted at construction; not updated by WS events.
   */
  initialImage: string | undefined;
  /**
   * Channel name snapshotted at construction; not updated by WS events.
   */
  initialName: string;
  /** Pending action from the {@link ChannelEditImageSheet}, or `null` when idle. */
  pendingAction: EditChannelImagePendingAction | null;
  /** `undefined` = untouched, `File` = newly picked, `null` = reset. */
  updatedImage: File | null | undefined;
};

/**
 * Holds the editable state for the channel details form (name + image) plus the
 * pending image-picker action. The channel's name and image are snapshotted
 * once at construction and are intentionally **not** updated by WebSocket
 * events, so an inbound `channel.updated` does not clobber the user's
 * in-progress edits. Leaf components can subscribe to narrow slices via
 * {@link useStateStore}.
 *
 * @experimental This API is experimental and is subject to change.
 */
export class EditChannelDetailsStore {
  public state: StateStore<EditChannelDetailsState>;

  constructor(channel: Channel) {
    const initialName = channel.data?.name ?? '';
    const initialImage = channel.data?.image;

    this.state = new StateStore<EditChannelDetailsState>({
      currentName: initialName,
      initialImage,
      initialName,
      pendingAction: null,
      updatedImage: undefined,
    });
  }

  /** Updates the current value of the name input. */
  setCurrentName(currentName: string) {
    this.state.partialNext({ currentName });
  }

  /**
   * Updates the picked image. `undefined` = untouched, `File` = newly picked,
   * `null` = reset.
   */
  setUpdatedImage(updatedImage: File | null | undefined) {
    this.state.partialNext({ updatedImage });
  }

  /** Sets the pending image-picker action, or `null` to clear it. */
  setPendingAction(pendingAction: EditChannelImagePendingAction | null) {
    this.state.partialNext({ pendingAction });
  }
}

/** Whether the name input differs from the channel's initial name. */
export const isNameDirty = (state: EditChannelDetailsState) =>
  state.currentName !== state.initialName;

/**
 * Whether the image has unsaved changes. The image is dirty once touched
 * (`updatedImage !== undefined`), except when both the initial and updated
 * image are falsy (no image before, none now).
 */
export const isImageDirty = (state: EditChannelDetailsState) =>
  !(state.updatedImage === undefined || (!state.updatedImage && !state.initialImage));

const selectIsNameDirty = (state: EditChannelDetailsState) => ({
  isNameDirty: isNameDirty(state),
});

const selectIsImageDirty = (state: EditChannelDetailsState) => ({
  isImageDirty: isImageDirty(state),
});

/**
 * Subscribes to an {@link EditChannelDetailsStore} and returns whether the name
 * input has unsaved changes.
 *
 * @experimental This API is experimental and is subject to change.
 */
export const useIsNameDirty = (store: EditChannelDetailsStore) =>
  useStateStore(store.state, selectIsNameDirty).isNameDirty;

/**
 * Subscribes to an {@link EditChannelDetailsStore} and returns whether the image
 * has unsaved changes.
 *
 * @experimental This API is experimental and is subject to change.
 */
export const useIsImageDirty = (store: EditChannelDetailsStore) =>
  useStateStore(store.state, selectIsImageDirty).isImageDirty;
