const DB_NAME = "CataloguerApp";
const DB_VERSION = 2; // bumped to add "blobs" object store
let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("store")) {
        db.createObjectStore("store");
      }
      if (!db.objectStoreNames.contains("blobs")) {
        db.createObjectStore("blobs");
      }
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readonly");
    const req = tx.objectStore("store").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readwrite");
    const req = tx.objectStore("store").put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbSetBlob(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    const req = tx.objectStore("blobs").put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readonly");
    const req = tx.objectStore("blobs").get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDeleteBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    const req = tx.objectStore("blobs").delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAllBlobKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readonly");
    const req = tx.objectStore("blobs").getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function base64ToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function migrateStateToBlobs(state) {
  const needsMigration = state.items.some((it) =>
    (it.thumbnail && it.thumbnail.startsWith("data:")) ||
    (it.images || []).some((s) => typeof s === "string" && s.startsWith("data:")) ||
    (it.videos || []).some((v) => typeof v === "object" && v.kind === "upload" && v.src?.startsWith("data:"))
  );

  if (!needsMigration) return state;

  const newItems = await Promise.all(
    state.items.map(async (item) => {
      let { thumbnail, images = [], videos = [] } = item;

      // Thumbnail
      if (thumbnail && thumbnail.startsWith("data:")) {
        const blobKey = `blob:thumb:${item.id}`;
        await dbSetBlob(blobKey, base64ToBlob(thumbnail));
        thumbnail = blobKey;
      }

      // Images
      images = await Promise.all(
        images.map(async (src, i) => {
          if (typeof src === "string" && src.startsWith("data:")) {
            const blobKey = `blob:img:${item.id}:${i}`;
            await dbSetBlob(blobKey, base64ToBlob(src));
            return blobKey;
          }
          return src;
        })
      );

      // Uploaded videos
      videos = await Promise.all(
        videos.map(async (v, i) => {
          if (typeof v === "object" && v.kind === "upload" && v.src?.startsWith("data:")) {
            const blobKey = `blob:vid:${item.id}:${i}`;
            await dbSetBlob(blobKey, base64ToBlob(v.src));
            return { ...v, src: blobKey };
          }
          return v;
        })
      );

      return { ...item, thumbnail, images, videos };
    })
  );

  return { ...state, items: newItems };
}