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
