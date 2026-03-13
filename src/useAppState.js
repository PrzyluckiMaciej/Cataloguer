import { useState, useEffect, useRef, useCallback } from "react";
import { dbGet, dbSet } from "./db";
import { uid, emptyState } from "./helpers";

export function useAppState() {
  const [state, setState] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const saving = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    dbGet("appState")
      .then((saved) => {
        if (saved) {
          setState(saved);
          setActiveTabId(saved.tabs[0]?.id || null);
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
  }, []);

  // Persist to IndexedDB on every state change
  useEffect(() => {
    if (!state || saving.current) return;
    saving.current = true;
    dbSet("appState", state).finally(() => { saving.current = false; });
  }, [state]);

  const update = useCallback((fn) => setState((prev) => fn(prev)), []);

  const switchTab = (id) => {
    setActiveTabId(id);
    setActiveListId(null);
  };

  // ── Tab CRUD ──────────────────────────────────────────────────────────────
  const createTab = (name) => {
    const tab = { id: uid(), name };
    update((s) => ({ ...s, tabs: [...s.tabs, tab] }));
    switchTab(tab.id);
  };

  const updateTab = (tab) =>
    update((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === tab.id ? tab : t)) }));

  const deleteTab = (id, tabs) => {
    const listIds = state.lists.filter((l) => l.tabId === id).map((l) => l.id);
    update((s) => ({
      ...s,
      tabs: s.tabs.filter((t) => t.id !== id),
      lists: s.lists.filter((l) => l.tabId !== id),
      items: s.items.filter((it) => !listIds.includes(it.listId)),
    }));
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
    update((s) => ({
      ...s,
      lists: s.lists.filter((l) => l.id !== id),
      items: s.items.filter((it) => it.listId !== id),
    }));
    if (activeListId === id) setActiveListId(null);
  };

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const createItem = (item) =>
    update((s) => ({ ...s, items: [...s.items, item] }));

  const updateItem = (item) =>
    update((s) => ({ ...s, items: s.items.map((it) => (it.id === item.id ? item : it)) }));

  const deleteItem = (id) =>
    update((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));

  return {
    state,
    setState,
    activeTabId,
    activeListId,
    setActiveListId,
    switchTab,
    createTab, updateTab, deleteTab,
    createList, updateList, deleteList,
    createItem, updateItem, deleteItem,
  };
}