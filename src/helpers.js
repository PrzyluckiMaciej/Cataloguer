export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

export const DEFAULT_TIERS = ["S", "A", "B", "C", "D"];

export function emptyState() {
  const tabId = uid();
  return {
    tabs: [{ id: tabId, name: "My Collection" }],
    lists: [],
    items: [],
  };
}

export function isBlobRef(src) {
  return typeof src === "string" && src.startsWith("blob:") && !src.startsWith("blob:http");
}

export function makeBlobKey(type, itemId, index) {
  // type: "thumb" | "img" | "vid"
  return `blob:${type}:${itemId}:${index ?? uid()}`;
}