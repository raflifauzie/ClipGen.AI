import { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_HISTORY_ITEMS } from '../constants';
import { clearStoredHistory, deleteStoredHistory, listStoredHistory, saveStoredHistory } from '../services/videoStore';
import type { HistoryItem, StoredHistoryItem } from '../types';

export type NewHistoryEntry = Omit<HistoryItem, 'videoUrl'>;

export interface HistoryState {
  items: HistoryItem[];
  isLoading: boolean;
  add: (entry: NewHistoryEntry, blob: Blob) => Promise<HistoryItem>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Keeps the generation history in IndexedDB so it survives a reload, and hands
 * out object URLs for playback. Every object URL is revoked when the entry is
 * deleted or the component unmounts.
 */
export function useHistory(): HistoryState {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const objectUrls = useRef<string[]>([]);

  const createObjectUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    objectUrls.current.push(url);
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url: string): void => {
    URL.revokeObjectURL(url);
    objectUrls.current = objectUrls.current.filter((known) => known !== url);
  }, []);

  useEffect(() => {
    let cancelled = false;

    listStoredHistory()
      .then((stored: StoredHistoryItem[]) => {
        if (cancelled) {
          return;
        }
        const restored = stored.map((entry) => ({ ...entry, videoUrl: createObjectUrl(entry.blob) }));
        setItems(restored);
      })
      .catch((error: unknown) => {
        console.warn('Could not load the local history', error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [createObjectUrl]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    [],
  );

  const add = useCallback(
    async (entry: NewHistoryEntry, blob: Blob): Promise<HistoryItem> => {
      const stored: StoredHistoryItem = { ...entry, blob };
      try {
        await saveStoredHistory(stored);
      } catch (error) {
        console.warn('Could not persist the generation in the local history', error);
      }
      const item: HistoryItem = { ...entry, videoUrl: createObjectUrl(blob) };
      setItems((current) => [item, ...current].slice(0, MAX_HISTORY_ITEMS));
      return item;
    },
    [createObjectUrl],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setItems((current) => {
        const target = current.find((item) => item.id === id);
        if (target) {
          revokeObjectUrl(target.videoUrl);
        }
        return current.filter((item) => item.id !== id);
      });
      try {
        await deleteStoredHistory(id);
      } catch (error) {
        console.warn('Could not remove the generation from the local history', error);
      }
    },
    [revokeObjectUrl],
  );

  const clear = useCallback(async (): Promise<void> => {
    setItems((current) => {
      current.forEach((item) => revokeObjectUrl(item.videoUrl));
      return [];
    });
    try {
      await clearStoredHistory();
    } catch (error) {
      console.warn('Could not clear the local history', error);
    }
  }, [revokeObjectUrl]);

  return { items, isLoading, add, remove, clear };
}
