import { G, css } from "./styles";
import { useAppState } from "./useAppState";
import { useDataIO } from "./useDataIO";
import TopBar from "./components/TopBar";
import TabView from "./components/TabView";
import CustomScrollbar from "./components/CustomScrollbar";

export default function App() {
  const {
    state, setState,
    activeTabId, activeListId, setActiveListId,
    saveError, clearSaveError,
    switchTab,
    createTab, updateTab, deleteTab,
    createList, updateList, deleteList, duplicateList,
    createItem, updateItem, updateItems, deleteItem,
  } = useAppState();

  const {
    importRef, 
    importError, 
    importing,
    importProgress,
    exporting, 
    exportProgress,
    handleExport, 
    cancelImport,
    handleImport, 
    clearImportError 
  } = useDataIO(state, (parsed) => {
    setState(parsed);
    switchTab(parsed.tabs[0]?.id || null);
    setActiveListId(null);
  });

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
    <div style={{ ...css.app, height: "100vh", overflow: "hidden" }}>

      <TopBar
        tabs={state.tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onNewTab={createTab}
        onExport={handleExport}
        onImport={handleImport}
        importRef={importRef}
      />

      {exporting && (
        <div style={{ background: G.surfaceHigh, color: G.textMuted, fontSize: 12, padding: "8px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span>↓ Exporting... {exportProgress.phase}</span>
            {/* Removed cancel button here */}
          </div>
          {exportProgress.total > 0 && (
            <>
              <div style={{ 
                width: "100%", 
                height: 4, 
                background: G.border,
                borderRadius: 2,
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: `${(exportProgress.current / exportProgress.total) * 100}%`, 
                  height: "100%", 
                  background: G.accent,
                  transition: "width 0.3s"
                }} />
              </div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                {exportProgress.current} / {exportProgress.total} items
              </div>
            </>
          )}
        </div>
      )}

      {importing && (
        <div style={{ background: G.surfaceHigh, color: G.textMuted, fontSize: 12, padding: "8px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span>↑ Importing... {importProgress.phase}</span>
            <button 
              onClick={cancelImport}
              style={{ ...css.ghostBtn, fontSize: 11, padding: "2px 8px" }}
            >
              Cancel
            </button>
          </div>
          <div style={{ 
            width: "100%", 
            height: 4, 
            background: G.border,
            borderRadius: 2,
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${importProgress.percent}%`, 
              height: "100%", 
              background: G.accent,
              transition: "width 0.3s"
            }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 11 }}>
            {importProgress.itemsProcessed > 0 && `${importProgress.itemsProcessed} items processed`}
          </div>
        </div>
      )}

      {importError && (
        <div style={{ background: G.dangerDim, color: G.text, fontSize: 12, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {importError}
          <button style={{ background: "none", border: "none", color: G.text, cursor: "pointer", fontSize: 13 }} onClick={clearImportError}>✕</button>
        </div>
      )}

      {saveError && (
        <div style={{ background: G.dangerDim, color: G.text, fontSize: 12, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          ⚠ {saveError}
          <button style={{ background: "none", border: "none", color: G.text, cursor: "pointer", fontSize: 13 }} onClick={clearSaveError}>✕</button>
        </div>
      )}

      <CustomScrollbar style={{ flex: 1 }}>
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
      </CustomScrollbar>

    </div>
  );
}