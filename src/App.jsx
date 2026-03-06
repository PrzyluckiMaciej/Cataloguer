import { useState, useEffect, useRef, useCallback } from "react";
import { dbGet, dbSet } from "./db";
import { uid, emptyState } from "./helpers";
import { G, css } from "./styles";
import EditableText from "./components/EditableText";
import ListCard from "./components/ListCard";
import ListView from "./components/ListView";
import ListFormModal from "./components/ListFormModal";
import NameFormModal from "./components/NameFormModal";
import ConfirmModal from "./components/ConfirmModal";

export default function App() {
  const [state, setState] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [modal, setModal] = useState(null);
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

  // Persist to IndexedDB whenever state changes
  useEffect(() => {
    if (!state || saving.current) return;
    saving.current = true;
    dbSet("appState", state).finally(() => { saving.current = false; });
  }, [state]);

  const update = useCallback((fn) => setState((prev) => fn(prev)), []);

  // Switch tab — always go back to the overview
  const switchTab = (id) => {
    setActiveTabId(id);
    setActiveListId(null);
  };

  if (!state) {
    return (
      <div style={{ ...css.app, alignItems: "center", justifyContent: "center", fontSize: 13, color: G.textMuted }}>
        Loading…
      </div>
    );
  }

  const activeTab = state.tabs.find((t) => t.id === activeTabId) || state.tabs[0];
  const activeList = activeListId ? state.lists.find((l) => l.id === activeListId) : null;
  const tabLists = state.lists.filter((l) => l.tabId === activeTabId);

  // ── Tab CRUD ──────────────────────────────────────────────────────────────
  const createTab = (name) => {
    const tab = { id: uid(), name };
    update((s) => ({ ...s, tabs: [...s.tabs, tab] }));
    switchTab(tab.id);
  };

  const updateTab = (tab) =>
    update((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === tab.id ? tab : t)) }));

  const deleteTab = (id) => {
    const listIds = state.lists.filter((l) => l.tabId === id).map((l) => l.id);
    update((s) => ({
      ...s,
      tabs: s.tabs.filter((t) => t.id !== id),
      lists: s.lists.filter((l) => l.tabId !== id),
      items: s.items.filter((it) => !listIds.includes(it.listId)),
    }));
    switchTab(state.tabs.find((t) => t.id !== id)?.id || null);
  };

  // ── List CRUD ─────────────────────────────────────────────────────────────
  const createList = (list) => {
    update((s) => ({ ...s, lists: [...s.lists, list] }));
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

  return (
    <div style={css.app}>

      {/* Top navigation bar */}
      <div style={css.topBar}>
        <div style={{ display: "flex", alignItems: "center", paddingRight: 24, marginRight: 12, borderRight: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: G.accent }}>
            Catalogue
          </span>
        </div>

        {state.tabs.map((tab) => (
          <button key={tab.id} style={css.tabBtn(tab.id === activeTabId)} onClick={() => switchTab(tab.id)}>
            {tab.name}
          </button>
        ))}

        <button style={{ ...css.tabBtn(false), color: G.textDim }} onClick={() => setModal("newTab")}>
          ＋ Tab
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "28px 32px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {activeTab && (
          <>
            {/* Breadcrumb header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              {activeList ? (
                <>
                  <button
                    onClick={() => setActiveListId(null)}
                    style={{ ...css.ghostBtn, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    ‹ {activeTab.name}
                  </button>
                  <span style={{ color: G.textDim, fontSize: 14 }}>›</span>
                  <span style={{ fontSize: 22, letterSpacing: "0.04em" }}>{activeList.name}</span>
                </>
              ) : (
                <>
                  <EditableText
                    value={activeTab.name}
                    onSave={(n) => updateTab({ ...activeTab, name: n })}
                    style={{ fontSize: 26, letterSpacing: "0.06em", fontWeight: "normal" }}
                  />
                  <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={() => setModal("newList")}>
                    + New list
                  </button>
                  {state.tabs.length > 1 && (
                    <button
                      style={{ ...css.ghostBtn, fontSize: 11, color: G.danger, borderColor: G.dangerDim, marginLeft: "auto" }}
                      onClick={() => setModal({ type: "confirm", msg: `Delete tab "${activeTab.name}" and everything in it?`, fn: () => deleteTab(activeTab.id) })}
                    >
                      Delete tab
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Tab overview — list of ListCards */}
            {!activeList && (
              <>
                {tabLists.length === 0 && (
                  <div style={{ color: G.textDim, fontStyle: "italic", fontSize: 13 }}>
                    No lists yet. Create one to get started.
                  </div>
                )}
                {tabLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    itemCount={state.items.filter((it) => it.listId === list.id).length}
                    onSelect={() => setActiveListId(list.id)}
                    onUpdate={updateList}
                    onDelete={() => deleteList(list.id)}
                  />
                ))}
              </>
            )}

            {/* List detail view */}
            {activeList && (
              <ListView
                list={activeList}
                items={state.items}
                onUpdate={updateList}
                onDelete={() => deleteList(activeList.id)}
                onItemCreate={createItem}
                onItemUpdate={updateItem}
                onItemDelete={deleteItem}
              />
            )}
          </>
        )}
      </div>

      {/* Global modals */}
      {modal === "newTab" && (
        <NameFormModal
          title="New Tab"
          onSave={(n) => { createTab(n); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "newList" && (
        <ListFormModal
          tabId={activeTabId}
          onSave={(list) => { createList(list); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}

    </div>
  );
}
