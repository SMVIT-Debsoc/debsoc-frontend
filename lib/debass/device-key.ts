export const DEBASS_DEVICE_KEY_STORAGE = "debsoc:assistant:openrouter-key";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRememberedDebassKey(): string | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const value = storage.getItem(DEBASS_DEVICE_KEY_STORAGE)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function writeRememberedDebassKey(key: string): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(DEBASS_DEVICE_KEY_STORAGE, key);
    return true;
  } catch {
    return false;
  }
}

export function removeRememberedDebassKey(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(DEBASS_DEVICE_KEY_STORAGE);
    return true;
  } catch {
    return false;
  }
}
