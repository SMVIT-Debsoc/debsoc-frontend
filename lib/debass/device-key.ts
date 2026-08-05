const DATABASE_NAME = "debass-device-vault";
const STORE_NAME = "vault";
const KEY_RECORD = "encryption-key";
const CIPHERTEXT_RECORD = "encrypted-api-key";

type EncryptedKeyRecord = {
  version: 1;
  iv: number[];
  ciphertext: number[];
};

function canUseVault() {
  return typeof window !== "undefined" && "indexedDB" in window && Boolean(window.crypto?.subtle);
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open browser key storage."));
  });
}

function readRecord<T>(database: IDBDatabase, id: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error("Could not read browser key storage."));
  });
}

function writeRecord(database: IDBDatabase, id: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not write browser key storage."));
  });
}

function deleteRecord(database: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear browser key storage."));
  });
}

export async function rememberDeviceKey(apiKey: string): Promise<void> {
  if (!canUseVault()) throw new Error("Encrypted browser storage is unavailable.");
  const database = await openVault();
  try {
    const encryptionKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, encryptionKey, new TextEncoder().encode(apiKey));
    await writeRecord(database, KEY_RECORD, encryptionKey);
    await writeRecord(database, CIPHERTEXT_RECORD, { version: 1, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) } satisfies EncryptedKeyRecord);
  } finally {
    database.close();
  }
}

export async function loadRememberedDeviceKey(): Promise<string | null> {
  if (!canUseVault()) return null;
  const database = await openVault();
  try {
    const [encryptionKey, record] = await Promise.all([
      readRecord<CryptoKey>(database, KEY_RECORD),
      readRecord<EncryptedKeyRecord>(database, CIPHERTEXT_RECORD),
    ]);
    if (!encryptionKey || !record || record.version !== 1) return null;
    const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(record.iv) }, encryptionKey, new Uint8Array(record.ciphertext));
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  } finally {
    database.close();
  }
}

export async function clearRememberedDeviceKey(): Promise<void> {
  if (!canUseVault()) return;
  const database = await openVault();
  try {
    await Promise.all([deleteRecord(database, KEY_RECORD), deleteRecord(database, CIPHERTEXT_RECORD)]);
  } finally {
    database.close();
  }
}
