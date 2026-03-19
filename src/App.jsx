import { G, css } from "./styles";
import { useAppState } from "./useAppState";
import { useDataIO } from "./useDataIO";
import TopBar from "./components/TopBar";
import TabView from "./components/TabView";

export default function App() {
  const {
    state, setState,
    activeTabId, activeListId, setActiveListId,
    switchTab,
    createTab, updateTab, deleteTab,
    createList, updateList, deleteList, duplicateList,
    createItem, updateItem, updateItems, deleteItem,
  } = useAppState();

  const { importRef, importError, handleExport, handleImport, clearImportError } = useDataIO(
    state,
    (parsed) => {
      setState(parsed);
      switchTab(parsed.tabs[0]?.id || null);
      setActiveListId(null);
    }
  );

  if (!state) {
    return (
      <div style={{ ...css.app, alignItems: "center", justifyContent: "center", fontSize: 13, color: G.textMuted }}>
        Loading…
      </div>
    );
  }

  const activeTab = state.tabs.find((t) => t.id === activeTabId) || state.tabs[0];
  const activeList = activeListId ? state.lists.find((l) => l.id === activeListId) : null;
  const tabLists = state.lists
    .filter((l) => l.tabId === activeTabId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div style={css.app}>

      <TopBar
        tabs={state.tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onNewTab={createTab}
        onExport={handleExport}
        onImport={handleImport}
        importRef={importRef}
      />

      {importError && (
        <div style={{ background: G.dangerDim, color: G.text, fontSize: 12, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {importError}
          <button style={{ background: "none", border: "none", color: G.text, cursor: "pointer", fontSize: 13 }} onClick={clearImportError}>✕</button>
        </div>
      )}

      {activeTab && (
        <TabView
          state={state}
          activeTab={activeTab}
          activeList={activeList}
          tabLists={tabLists}
          activeTabId={activeTabId}
          onSetActiveList={setActiveListId}
          onUpdateTab={updateTab}
          onDeleteTab={deleteTab}
          onCreateList={createList}
          onUpdateList={updateList}
          onDeleteList={deleteList}
          onDuplicateList={duplicateList}
          onCreateItem={createItem}
          onUpdateItem={updateItem}
          onUpdateItems={updateItems}
          onDeleteItem={deleteItem}
        />
      )}

    </div>
  );
}