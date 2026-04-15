import { useState, useEffect, useRef, useCallback } from "react";
import {
  dbGetState, dbSetState, dbGetBlob, dbSetBlob, dbDeleteBlob, dbGetAllBlobKeys,
  migrateStateToBlobs, blobToBase64,
} from "./db";
import { uid, emptyState, isBlobRef, makeBlobKey } from "./helpers";

export function useBlobUrl(src) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevSrc = useRef(null);
  const prevUrl = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (src === prevSrc.current) return;
    prevSrc.current = src;

    if (prevUrl.current && prevUrl.current.startsWith("blob:http")) {
      URL.revokeObjectURL(prevUrl.current);
      prevUrl.current = null;
    }

    if (!src) { setUrl(null); setLoading(false); return; }
    if (!isBlobRef(src)) { setUrl(src); setLoading(false); return; }

    setLoading(true);
    const loadBlob = async () => {
      try {
        const blob = await dbGetBlob(src);
        if (!isMounted.current) return;
        if (!blob) { setUrl(null); setLoading(false); return; }
        const objUrl = URL.createObjectURL(blob);
        if (!isMounted.current) { URL.revokeObjectURL(objUrl); return; }
        prevUrl.current = objUrl;
        setUrl(objUrl);
        setLoading(false);
      } catch (error) {
        if (isMounted.current) { setUrl(null); setLoading(false); }
      }
    };
    loadBlob();
  }, [src]);

  useEffect(() => {
    return () => {
      if (prevUrl.current && prevUrl.current.startsWith("blob:http")) {
        URL.revokeObjectURL(prevUrl.current);
      }
    };
  }, []);

  return { url, loading };
}

function collectBlobRefs(item) {
  const refs = [];
  if (item.thumbnail && isBlobRef(item.thumbnail)) refs.push(item.thumbnail);
  (item.images || []).forEach((s) => { if (isBlobRef(s)) refs.push(s); });
  (item.videos || []).forEach((v) => { if (v?.kind === "upload" && isBlobRef(v.src)) refs.push(v.src); });
  return refs;
}

async function validateBlobRefs(state) {
  const items = await Promise.all(
    state.items.map(async (item) => {
      let needsUpdate = false;
      const updatedItem = { ...item };

      if (item.thumbnail && isBlobRef(item.thumbnail)) {
        const blob = await dbGetBlob(item.thumbnail);
        if (!blob) { updatedItem.thumbnail = null; needsUpdate = true; }
      }

      if (item.images) {
        const validatedImages = await Promise.all(
          item.images.map(async (src) => {
            if (isBlobRef(src)) {
              const blob = await dbGetBlob(src);
              if (!blob) { needsUpdate = true; return null; }
            }
            return src;
          })
        );
        updatedItem.images = validatedImages.filter(Boolean);
        if (validatedImages.length !== item.images.length) needsUpdate = true;
      }

      if (item.videos) {
        const validatedVideos = await Promise.all(
          item.videos.map(async (v) => {
            if (v?.kind === "upload" && isBlobRef(v.src)) {
              const blob = await dbGetBlob(v.src);
              if (!blob) { needsUpdate = true; return null; }
            }
            return v;
          })
        );
        updatedItem.videos = validatedVideos.filter(Boolean);
        if (validatedVideos.length !== item.videos.length) needsUpdate = true;
      }

      return needsUpdate ? updatedItem : item;
    })
  );

  if (items.some((item, i) => item !== state.items[i])) {
    return { ...state, items };
  }
  return state;
}

export function useAppState(activeDbId) {
  const [state, setState] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const saving = useRef(false);
  const persistTimer = useRef(null);

  useEffect(() => {
    if (!activeDbId) return;
    setState(null);
    setActiveTabId(null);
    setActiveListId(null);

    dbGetState(activeDbId)
      .then(async (saved) => {
        if (saved) {
          const validatedState = await validateBlobRefs(saved);
          const migrated = await migrateStateToBlobs(validatedState);
          if (migrated !== saved) {
            await dbSetState(activeDbId, migrated).catch(() => {});
          }
          setState(migrated);
          setActiveTabId(migrated.tabs[0]?.id || null);
        } else {
          const s = emptyState();
          setState(s);
          setActiveTabId(s.tabs[0].id);
        }
      })
      .catch(() => {
        const s = emptyState();
        setState(s);
        setActiveTabId(s.tabs[0].id);
      });
  }, [activeDbId]);

  useEffect(() => {
    if (!state || !activeDbId) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      if (saving.current) return;
      saving.current = true;
      dbSetState(activeDbId, state)
        .catch((err) => {
          const msg = err?.message || String(err);
          if (msg.includes("too large") || msg.includes("structured clone")) {
            setSaveError("Could not save — the data is too large for the browser's storage. Try removing large images or video files.");
          } else {
            setSaveError("Could not save changes. Your browser storage may be full.");
          }
        })
        .finally(() => { saving.current = false; });
    }, 500);
    return () => clearTimeout(persistTimer.current);
  }, [state, activeDbId]);

  const update = useCallback((fn) => setState((prev) => fn(prev)), []);

  const switchTab = (id) => {
    setActiveTabId(id);
    setActiveListId(null);
  };

  const cleanupOrphanedBlobs = useCallback(async (nextState) => {
    const allUsed = new Set(nextState.items.flatMap(collectBlobRefs));
    const allKeys = await dbGetAllBlobKeys();
    await Promise.all(
      allKeys.filter((k) => !allUsed.has(k)).map((k) => dbDeleteBlob(k))
    );
  }, []);

  const createTab = (name) => {
    const tab = { id: uid(), name };
    update((s) => ({ ...s, tabs: [...s.tabs, tab] }));
    switchTab(tab.id);
  };

  const updateTab = (tab) =>
    update((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === tab.id ? tab : t)) }));

  const deleteTab = (id, tabs) => {
    const listIds = state.lists.filter((l) => l.tabId === id).map((l) => l.id);
    const nextState = {
      ...state,
      tabs: state.tabs.filter((t) => t.id !== id),
      lists: state.lists.filter((l) => l.tabId !== id),
      items: state.items.filter((it) => !listIds.includes(it.listId)),
    };
    setState(nextState);
    cleanupOrphanedBlobs(nextState);
    switchTab(tabs.find((t) => t.id !== id)?.id || null);
  };

  // ── List CRUD ─────────────────────────────────────────────────────────────
  const createList = (list) => {
    const order = state.lists.filter((l) => l.tabId === activeTabId).length;
    update((s) => ({ ...s, lists: [...s.lists, { ...list, order }] }));
    setActiveListId(list.id);
  };

  const updateList = (list) =>
    update((s) => ({ ...s, lists: s.lists.map((l) => (l.id === list.id ? list : l)) }));

  const deleteList = (id) => {
    const nextState = {
      ...state,
      lists: state.lists.filter((l) => l.id !== id),
      items: state.items.filter((it) => it.listId !== id),
    };
    setState(nextState);
    cleanupOrphanedBlobs(nextState);
    if (activeListId === id) setActiveListId(null);
  };

  const duplicateList = (id) => {
    const original = state.lists.find((l) => l.id === id);
    if (!original) return;
    const newListId = uid();
    const order = state.lists.filter((l) => l.tabId === original.tabId).length;
    const newList = { ...original, id: newListId, name: `${original.name} (copy)`, order };
    const originalItems = state.items.filter((it) => it.listId === id);
    const newItems = originalItems.map((it) => ({ ...it, id: uid(), listId: newListId }));
    (async () => {
      for (const [origItem, newItem] of originalItems.map((o, i) => [o, newItems[i]])) {
        if (origItem.thumbnail && isBlobRef(origItem.thumbnail)) {
          const blob = await dbGetBlob(origItem.thumbnail);
          if (blob) {
            const newKey = makeBlobKey("thumb", newItem.id);
            await dbSetBlob(newKey, blob);
            newItem.thumbnail = newKey;
          }
        }
        if (origItem.images) {
          newItem.images = await Promise.all(
            origItem.images.map(async (src, i) => {
              if (!isBlobRef(src)) return src;
              const blob = await dbGetBlob(src);
              if (!blob) return src;
              const newKey = makeBlobKey("img", newItem.id, i);
              await dbSetBlob(newKey, blob);
              return newKey;
            })
          );
        }
        if (origItem.videos) {
          newItem.videos = await Promise.all(
            origItem.videos.map(async (v, i) => {
              if (v?.kind !== "upload" || !isBlobRef(v.src)) return v;
              const blob = await dbGetBlob(v.src);
              if (!blob) return v;
              const newKey = makeBlobKey("vid", newItem.id, i);
              await dbSetBlob(newKey, blob);
              return { ...v, src: newKey };
            })
          );
        }
      }
      update((s) => ({
        ...s,
        lists: [...s.lists, newList],
        items: [...s.items, ...newItems],
      }));
    })();
  };

  const createItem = (item) =>
    update((s) => ({ ...s, items: [...s.items, item] }));

  const updateItem = (item) => {
    update((s) => {
      const next = { ...s, items: s.items.map((it) => (it.id === item.id ? item : it)) };
      cleanupOrphanedBlobs(next);
      return next;
    });
  };

  const updateItems = (updatedItems) => {
    const map = new Map(updatedItems.map((it) => [it.id, it]));
    update((s) => ({ ...s, items: s.items.map((it) => map.has(it.id) ? map.get(it.id) : it) }));
  };

  const deleteItem = (id) => {
    update((s) => {
      const next = { ...s, items: s.items.filter((it) => it.id !== id) };
      cleanupOrphanedBlobs(next);
      return next;
    });
  };

  return {
    state,
    setState,
    activeTabId,
    activeListId,
    setActiveListId,
    saveError,
    clearSaveError: () => setSaveError(null),
    switchTab,
    createTab, updateTab, deleteTab,
    createList, updateList, deleteList, duplicateList,
    createItem, updateItem, updateItems, deleteItem,
  };
}

export async function expandBlobRefsForExport(state) {
  const items = await Promise.all(
    state.items.map(async (item) => {
      let { thumbnail, images = [], videos = [] } = item;

      if (isBlobRef(thumbnail)) {
        const blob = await dbGetBlob(thumbnail);
        thumbnail = blob ? await blobToBase64(blob) : null;
      }

      images = await Promise.all(
        images.map(async (src) => {
          if (!isBlobRef(src)) return src;
          const blob = await dbGetBlob(src);
          return blob ? await blobToBase64(blob) : null;
        })
      );
      images = images.filter(Boolean);

      videos = await Promise.all(
        videos.map(async (v) => {
          if (v?.kind !== "upload" || !isBlobRef(v.src)) return v;
          const blob = await dbGetBlob(v.src);
          if (!blob) return null;
          return { ...v, src: await blobToBase64(blob) };
        })
      );
      videos = videos.filter(Boolean);

      return { ...item, thumbnail, images, videos };
    })
  );
  return { ...state, items };
}