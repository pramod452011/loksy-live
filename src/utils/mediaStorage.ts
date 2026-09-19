// Persistent Media Storage using IndexedDB and Data URLs
// Ensures uploaded videos and images never expire across browser sessions

const DB_NAME = 'loksy_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// Active session blob registry
const activeSessionBlobs = new Set<string>();

export function registerSessionBlob(url: string) {
  if (url && url.startsWith('blob:')) {
    activeSessionBlobs.add(url);
  }
}

export function isSessionBlobValid(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith('blob:')) return true;
  return activeSessionBlobs.has(url);
}

// Fallback high-fidelity CDN assets for remote Firestore cloud documents
export const DEFAULT_FALLBACK_VIDEO = 'https://res.cloudinary.com/demo/video/upload/celenarae.mp4';
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80';
export const DEFAULT_FALLBACK_THUMB = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80';

/**
 * Ensures media URLs sent to Firestore NEVER exceed the 1MB document limit.
 * Any Data URL, Blob URL, or string > 2000 chars is stripped to a clean CDN fallback.
 */
export function sanitizeUrlForFirestore(url?: string | null, fallbackUrl: string = DEFAULT_FALLBACK_IMAGE): string {
  if (!url || typeof url !== 'string') return fallbackUrl;
  const clean = url.trim();
  if (clean === '' || clean.startsWith('data:') || clean.startsWith('blob:') || clean.length > 2000) {
    return fallbackUrl;
  }
  return clean;
}

/**
 * Checks if a post mediaUrl is corrupted (empty, hotlink-blocked mixkit, or expired session blob)
 */
export function isMediaCorrupted(mediaUrl?: string | null): boolean {
  if (!mediaUrl || typeof mediaUrl !== 'string') return true;
  const clean = mediaUrl.trim();
  if (clean === '') return true;
  if (clean.includes('assets.mixkit.co')) return true;
  if (clean.startsWith('blob:') && !isSessionBlobValid(clean)) return true;
  return false;
}

/**
 * Save raw media record directly to IndexedDB.
 */
export async function saveMediaRecord(
  id: string,
  dataUrl: string,
  thumbnailUrl?: string,
  mimeType: string = 'image/jpeg'
): Promise<void> {
  if (!id || !dataUrl) return;
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id,
        dataUrl,
        thumbnailUrl: thumbnailUrl || dataUrl,
        mimeType,
        size: dataUrl.length,
        createdAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaStorage] saveMediaRecord error:', err);
  }
}

/**
 * Retrieve both dataUrl and thumbnailUrl from IndexedDB.
 */
export async function getStoredMediaRecord(
  id: string
): Promise<{ dataUrl: string; thumbnailUrl?: string } | null> {
  if (!id) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve({
            dataUrl: req.result.dataUrl,
            thumbnailUrl: req.result.thumbnailUrl,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Remove media record from IndexedDB.
 */
export async function deleteStoredMedia(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // quiet fallback
  }
}

/**
 * Save media file into IndexedDB and convert to Data URL for instant, permanent playback.
 */
export async function storeMedia(
  file: File | Blob,
  customId?: string
): Promise<{
  id: string;
  dataUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  size: number;
}> {
  const id = customId || `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mimeType =
    file.type ||
    (file instanceof File
      ? file.name.endsWith('.mp4')
        ? 'video/mp4'
        : file.name.endsWith('.webm')
        ? 'video/webm'
        : 'image/jpeg'
      : 'video/mp4');

  // Convert to Base64 Data URL (self-contained, never expires)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // Generate real frame thumbnail for videos
  let thumbnailUrl = '';
  if (mimeType.startsWith('video') || (file instanceof File && file.name.match(/\.(mp4|webm|mov|m4v)$/i))) {
    thumbnailUrl = await extractThumbnailFromVideo(dataUrl);
  } else {
    thumbnailUrl = dataUrl;
  }

  // Save to IndexedDB for persistent retrieval across reloads
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id,
        dataUrl,
        thumbnailUrl,
        mimeType,
        size: file.size,
        createdAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaStorage] IndexedDB store notice:', err);
  }

  return { id, dataUrl, thumbnailUrl, mimeType, size: file.size };
}

/**
 * Retrieve persistent media Data URL from IndexedDB by id.
 */
export async function getStoredMedia(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Extract a high-res video frame thumbnail from a video dataUrl or stream.
 */
export function extractThumbnailFromVideo(videoSource: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80');
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const fallback = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80';
    let timeoutId: number;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeAttribute('src');
      video.load();
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(fallback);
    }, 4500);

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      } catch {
        // quiet fallback
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.82);
          cleanup();
          resolve(thumb);
          return;
        }
      } catch {
        // quiet fallback
      }
      cleanup();
      resolve(fallback);
    };

    video.onerror = () => {
      cleanup();
      resolve(fallback);
    };

    video.src = videoSource;
  });
}
