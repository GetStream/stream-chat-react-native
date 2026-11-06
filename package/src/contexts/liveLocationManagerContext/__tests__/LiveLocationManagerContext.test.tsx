import React from 'react';

import { render } from '@testing-library/react-native';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { mockedApiResponse } from '../../../mock-builders/api/utils';
import { ChatProvider } from '../../chatContext/ChatContext';
import { LiveLocationManagerProvider } from '../LiveLocationManagerContext';

/**
 * `LiveLocationManager` has two independent teardowns since the LLC's instance-configuration change, and
 * the provider has to call both:
 *
 * - `unregisterSubscriptions()` — ref-counted, covers the event subscriptions.
 * - `dispose()` — releases the `client.config` subscription the constructor registers.
 *
 * Missing the second leaks a handle in the configuration registry on every remount, with no compile
 * error and no runtime symptom until memory is inspected. Hence a test rather than a comment.
 */
describe('LiveLocationManagerProvider teardown', () => {
  /** `LiveLocationManager.init()` queries the user's live locations on mount; mock it to an empty set. */
  const mockLiveLocations = (client: Parameters<typeof useMockedApis>[0]) =>
    useMockedApis(client, [mockedApiResponse({ active_live_locations: [] }, 'get')]);

  const renderProvider = async () => {
    const { client } = await initiateClientWithChannels();
    mockLiveLocations(client);
    const view = render(
      <ChatProvider value={{ client } as never}>
        <LiveLocationManagerProvider watchLocation={() => () => {}} />
      </ChatProvider>,
    );
    return { client, view };
  };

  it('releases the configuration subscription on unmount', async () => {
    const { client, view } = await renderProvider();

    // The manager registers itself against the `liveLocationManager` key in its constructor, so the
    // registry reports a live instance while it is mounted.
    expect(client.config.hasLiveInstances('liveLocationManager')).toBe(true);

    view.unmount();

    expect(client.config.hasLiveInstances('liveLocationManager')).toBe(false);
  });

  it('does not accumulate handles across repeated mounts', async () => {
    const { client } = await initiateClientWithChannels();
    mockLiveLocations(client);

    // React StrictMode's mount/unmount/mount runs this shape against one provider, and so does ordinary
    // navigation away and back. Each cycle must leave the registry empty rather than one handle heavier.
    for (let i = 0; i < 3; i++) {
      const view = render(
        <ChatProvider value={{ client } as never}>
          <LiveLocationManagerProvider watchLocation={() => () => {}} />
        </ChatProvider>,
      );
      expect(client.config.hasLiveInstances('liveLocationManager')).toBe(true);
      view.unmount();
      expect(client.config.hasLiveInstances('liveLocationManager')).toBe(false);
    }
  });
});
