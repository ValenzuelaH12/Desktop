const DB_NAME = 'v-suite-db';
const DB_VERSION = 1;

export interface OfflineSync {
  id?: number;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('incidencias')) {
        db.createObjectStore('incidencias', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mantenimiento')) {
        db.createObjectStore('mantenimiento', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('lecturas')) {
        db.createObjectStore('lecturas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const dbService = {
  async getAll(storeName: string): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName: string, data: any): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async putBatch(storeName: string, dataArray: any[]): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    dataArray.forEach(data => store.put(data));
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async addToSyncQueue(syncData: OfflineSync): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync-queue', 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const request = store.add(syncData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getSyncQueue(): Promise<OfflineSync[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync-queue', 'readonly');
      const store = transaction.objectStore('sync-queue');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async removeFromSyncQueue(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync-queue', 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
