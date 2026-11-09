import { MAX_HISTORY_ITEMS } from '../constants';
import type { StoredHistoryItem } from '../types';

const DB_NAME = 'clipgen';
const DB_VERSION = 1;
const STORE_NAME = 'history';

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support IndexedDB, so history cannot be stored.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open the local history database.'));
  });
}

function getDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

function runRequest<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return getDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = handler(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('The local history request failed.'));
      }),
  );
}

export async function listStoredHistory(): Promise<StoredHistoryItem[]> {
  const entries = await runRequest<StoredHistoryItem[]>('readonly', (store) => store.getAll() as IDBRequest<StoredHistoryItem[]>);
  return entries.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_HISTORY_ITEMS);
}

export async function saveStoredHistory(entry: StoredHistoryItem): Promise<void> {
  await runRequest('readwrite', (store) => store.put(entry));
}

export async function deleteStoredHistory(id: string): Promise<void> {
  await runRequest('readwrite', (store) => store.delete(id));
}

export async function clearStoredHistory(): Promise<void> {
  await runRequest('readwrite', (store) => store.clear());
}
