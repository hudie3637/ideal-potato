
const DB_NAME = 'SmartClosetDB';
const DB_VERSION = 1;
const STORES = {
  ITEMS: 'items',
  OUTFITS: 'outfits',
  CALENDAR: 'calendar',
  PROFILE: 'profile',
  USER: 'user_meta'
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.ITEMS)) db.createObjectStore(STORES.ITEMS);
      if (!db.objectStoreNames.contains(STORES.OUTFITS)) db.createObjectStore(STORES.OUTFITS);
      if (!db.objectStoreNames.contains(STORES.CALENDAR)) db.createObjectStore(STORES.CALENDAR);
      if (!db.objectStoreNames.contains(STORES.PROFILE)) db.createObjectStore(STORES.PROFILE);
      if (!db.objectStoreNames.contains(STORES.USER)) db.createObjectStore(STORES.USER);
    };
  });
};

export const saveData = async (storeName: string, key: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getData = async (storeName: string, key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteData = async (storeName: string, key: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
