import { StoreName, DBStoreMap } from "./types";

const DB_NAME = "cozify_idb";
const DB_VERSION = 1;

class CozifyIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined" || !window.indexedDB) {
      throw new Error("IndexedDB is not supported in this environment");
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Sessions store
          if (!db.objectStoreNames.contains("sessions")) {
            const sessionStore = db.createObjectStore("sessions", {
              keyPath: "id",
            });

            sessionStore.createIndex("createdAt", "createdAt", {
              unique: false,
            });
            sessionStore.createIndex("tag", "tag", { unique: false });
          }

          // 2. Todos store
          if (!db.objectStoreNames.contains("todos")) {
            const todoStore = db.createObjectStore("todos", { keyPath: "id" });

            todoStore.createIndex("createdAt", "createdAt", { unique: false });
            todoStore.createIndex("completed", "completed", { unique: false });
            todoStore.createIndex("tag", "tag", { unique: false });
            todoStore.createIndex("dueDate", "dueDate", { unique: false });
          }

          // 3. Theme key-value store
          if (!db.objectStoreNames.contains("theme")) {
            db.createObjectStore("theme", { keyPath: "key" });
          }

          // 4. Timer key-value store
          if (!db.objectStoreNames.contains("timer")) {
            db.createObjectStore("timer", { keyPath: "key" });
          }

          // 5. Settings key-value store
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "key" });
          }

          // 6. Offline Sync Queue store
          if (!db.objectStoreNames.contains("syncQueue")) {
            const syncStore = db.createObjectStore("syncQueue", {
              keyPath: "id",
            });

            syncStore.createIndex("timestamp", "timestamp", { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  public async getAll<K extends StoreName>(
    storeName: K,
  ): Promise<DBStoreMap[K][]> {
    try {
      const db = await this.getDB();

      return new Promise<DBStoreMap[K][]>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as DBStoreMap[K][]);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      return [];
    }
  }

  public async get<K extends StoreName>(
    storeName: K,
    key: IDBValidKey,
  ): Promise<DBStoreMap[K] | null> {
    try {
      const db = await this.getDB();

      return new Promise<DBStoreMap[K] | null>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve((request.result as DBStoreMap[K]) || null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      return null;
    }
  }

  public async put<K extends StoreName>(
    storeName: K,
    value: DBStoreMap[K],
  ): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      // IndexedDB storage fallback
    }
  }

  public async putBatch<K extends StoreName>(
    storeName: K,
    values: DBStoreMap[K][],
  ): Promise<void> {
    if (values.length === 0) return;
    try {
      const db = await this.getDB();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        for (const item of values) {
          store.put(item);
        }

        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = () => {
          reject(transaction.error);
        };
      });
    } catch {
      // IndexedDB storage fallback
    }
  }

  public async delete<K extends StoreName>(
    storeName: K,
    key: IDBValidKey,
  ): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      // IndexedDB storage fallback
    }
  }

  public async clear<K extends StoreName>(storeName: K): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch {
      // IndexedDB storage fallback
    }
  }
}

export const idb = new CozifyIndexedDB();
