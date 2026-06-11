import { act, renderHook } from '@testing-library/react-native';

import type { Channel } from 'stream-chat';

import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { getTestClientWithUser } from '../../mock-builders/mock';
import type { File } from '../../types/types';
import {
  EditChannelDetailsStore,
  useIsImageDirty,
  useIsNameDirty,
} from '../edit-channel-details-store';

const file: File = {
  name: 'pic.png',
  size: 1234,
  type: 'image/png',
  uri: 'file://pic.png',
};

const createChannel = async (data: { image?: string; name?: string } = {}) => {
  const client = await getTestClientWithUser({ id: 'me' });
  const response = generateChannelResponse({ channel: data });
  return client.channel('messaging', response.channel.id, response.channel) as Channel;
};

describe('EditChannelDetailsStore', () => {
  describe('constructor', () => {
    it('snapshots the initial name and image from the channel', async () => {
      const channel = await createChannel({
        image: 'http://img/original.png',
        name: 'Original',
      });

      const store = new EditChannelDetailsStore(channel);
      const state = store.state.getLatestValue();

      expect(state.initialName).toBe('Original');
      expect(state.initialImage).toBe('http://img/original.png');
      expect(state.currentName).toBe('Original');
      expect(state.updatedImage).toBeUndefined();
      expect(state.pendingAction).toBeNull();
    });

    it('defaults to empty name and undefined image when channel has none', async () => {
      const channel = await createChannel();

      const store = new EditChannelDetailsStore(channel);
      const state = store.state.getLatestValue();

      expect(state.initialName).toBe('');
      expect(state.initialImage).toBeUndefined();
      expect(state.currentName).toBe('');
    });
  });

  describe('setCurrentName', () => {
    it('updates currentName and leaves initialName untouched', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      store.setCurrentName('Renamed');

      const state = store.state.getLatestValue();
      expect(state.currentName).toBe('Renamed');
      expect(state.initialName).toBe('Original');
    });
  });

  describe('setUpdatedImage', () => {
    it('handles File, null and back to undefined', async () => {
      const channel = await createChannel();
      const store = new EditChannelDetailsStore(channel);

      store.setUpdatedImage(file);
      expect(store.state.getLatestValue().updatedImage).toBe(file);

      store.setUpdatedImage(null);
      expect(store.state.getLatestValue().updatedImage).toBeNull();

      store.setUpdatedImage(undefined);
      expect(store.state.getLatestValue().updatedImage).toBeUndefined();
    });
  });

  describe('setPendingAction', () => {
    it('sets each action value and clears back to null', async () => {
      const channel = await createChannel();
      const store = new EditChannelDetailsStore(channel);

      (['camera', 'library', 'reset'] as const).forEach((action) => {
        store.setPendingAction(action);
        expect(store.state.getLatestValue().pendingAction).toBe(action);
      });

      store.setPendingAction(null);
      expect(store.state.getLatestValue().pendingAction).toBeNull();
    });
  });

  describe('useIsNameDirty', () => {
    it('is false initially', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsNameDirty(store));
      expect(result.current).toBe(false);
    });

    it('reacts to name changes', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsNameDirty(store));
      expect(result.current).toBe(false);

      act(() => store.setCurrentName('Renamed'));
      expect(result.current).toBe(true);

      act(() => store.setCurrentName('Original'));
      expect(result.current).toBe(false);
    });

    it('treats untrimmed whitespace as dirty', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsNameDirty(store));

      act(() => store.setCurrentName('Original '));
      expect(result.current).toBe(true);
    });

    it('ignores image changes', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsNameDirty(store));

      act(() => store.setUpdatedImage(file));
      expect(result.current).toBe(false);
    });
  });

  describe('useIsImageDirty', () => {
    it('is false initially', async () => {
      const channel = await createChannel({ image: 'http://img/original.png' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsImageDirty(store));
      expect(result.current).toBe(false);
    });

    it('is dirty after a new image is picked', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsImageDirty(store));

      act(() => store.setUpdatedImage(file));
      expect(result.current).toBe(true);
    });

    it('ignores name changes', async () => {
      const channel = await createChannel({ name: 'Original' });
      const store = new EditChannelDetailsStore(channel);

      const { result } = renderHook(() => useIsImageDirty(store));

      act(() => store.setCurrentName('Renamed'));
      expect(result.current).toBe(false);
    });

    describe('with an initial image', () => {
      it('is dirty on reset and clean again when untouched', async () => {
        const channel = await createChannel({ image: 'http://img/original.png' });
        const store = new EditChannelDetailsStore(channel);

        const { result } = renderHook(() => useIsImageDirty(store));
        expect(result.current).toBe(false);

        act(() => store.setUpdatedImage(null));
        expect(result.current).toBe(true);

        act(() => store.setUpdatedImage(undefined));
        expect(result.current).toBe(false);
      });
    });

    describe('without an initial image', () => {
      it('is not dirty on reset but is dirty when a file is picked', async () => {
        const channel = await createChannel();
        const store = new EditChannelDetailsStore(channel);

        const { result } = renderHook(() => useIsImageDirty(store));

        act(() => store.setUpdatedImage(null));
        expect(result.current).toBe(false);

        act(() => store.setUpdatedImage(file));
        expect(result.current).toBe(true);
      });
    });
  });
});
