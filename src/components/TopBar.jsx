import { useState } from "react";
import { G, css } from "../styles";
import NameFormModal from "./NameFormModal";
import DatabaseManager from "./DatabaseManager";

export default function TopBar({
  tabs, activeTabId, onSwitchTab, onNewTab, onExport, onImport, importRef,
  databases, activeDbId, onSwitchDb, onCreateDb, onRenameDb, onDeleteDb,
}) {
  const [showNewTab, setShowNewTab] = useState(false);
  const [showDbManager, setShowDbManager] = useState(false);

  const activeDb = (databases || []).find((d) => d.id === activeDbId);

  return (
    <>
      <div style={css.topBar}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", paddingRight: 16, marginRight: 8, borderRight: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: G.accent }}>
            Cataloguer
          </span>
        </div>

        {/* Database switcher */}
        <button
          onClick={() => setShowDbManager(true)}
          title="Manage databases"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none",
            border: `1px solid ${G.border}`,
            color: G.textMuted,
            cursor: "pointer",
            fontSize: 11,
            padding: "3px 8px",
            letterSpacing: "0.06em",
            marginRight: 12,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = G.accentDim; e.currentTarget.style.color = G.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.textMuted; }}
        >
          <span style={{ fontSize: 10, color: G.accentDim }}>⬡</span>
          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeDb?.name || "…"}
          </span>
          <span style={{ opacity: 0.5, fontSize: 9 }}>▾</span>
        </button>

        {/* Tab divider */}
        <div style={{ width: 1, height: 18, background: G.border, marginRight: 8 }} />

        {/* Tabs */}
        {tabs.map((tab) => (
          <button key={tab.id} style={css.tabBtn(tab.id === activeTabId)} onClick={() => onSwitchTab(tab.id)}>
            {tab.name}
          </button>
        ))}

        <button style={{ ...css.tabBtn(false), color: G.textDim }} onClick={() => setShowNewTab(true)}>
          ＋ Tab
        </button>

        {/* Export / Import */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, borderLeft: `1px solid ${G.border}` }}>
          <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={onExport} title="Export all data as JSON">
            ↓ Export
          </button>
          <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={() => importRef.current.click()} title="Import from JSON backup">
            ↑ Import
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={onImport} />
        </div>
      </div>

      {showNewTab && (
        <NameFormModal
          title="New Tab"
          onSave={(n) => { onNewTab(n); setShowNewTab(false); }}
          onClose={() => setShowNewTab(false)}
        />
      )}

      {showDbManager && (
        <DatabaseManager
          databases={databases}
          activeDbId={activeDbId}
          onSwitch={(id) => { onSwitchDb(id); setShowDbManager(false); }}
          onCreate={async (name) => { await onCreateDb(name); setShowDbManager(false); }}
          onRename={onRenameDb}
          onDelete={onDeleteDb}
          onClose={() => setShowDbManager(false)}
        />
      )}
    </>
  );
}