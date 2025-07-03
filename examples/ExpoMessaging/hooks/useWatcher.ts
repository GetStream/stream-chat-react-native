import { useCallback, useEffect, useState } from 'react';
import { Channel } from 'stream-chat';

export const useWatchers = ({ channel }: { channel: Channel }) => {
  const [watchers, setWatchers] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queryWatchers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await channel.query({ watchers: { limit: 5, offset: 0 } });
      setWatchers(result?.watchers?.map((watcher) => watcher.id));
      setLoading(false);
      return;
    } catch (err) {
      console.error('An error has occurred while querying watchers: ', err);
      setError(err as Error);
    }
  }, [channel]);

  useEffect(() => {
    queryWatchers();
  }, [queryWatchers]);

  useEffect(() => {
    const watchingStartListener = channel.on('user.watching.start', (event) => {
      const userId = event?.user?.id;
      if (userId && userId.startsWith('ai-bot')) {
        setWatchers((prevWatchers) => [
          userId,
          ...(prevWatchers || []).filter((watcherId) => watcherId !== userId),
        ]);
      }
    });

    const watchingStopListener = channel.on('user.watching.stop', (event) => {
      const userId = event?.user?.id;
      if (userId && userId.startsWith('ai-bot')) {
        setWatchers((prevWatchers) =>
          (prevWatchers || []).filter((watcherId) => watcherId !== userId),
        );
      }
    });

    return () => {
      watchingStartListener.unsubscribe();
      watchingStopListener.unsubscribe();
    };
  }, [channel]);

  return { watchers, loading, error };
};
