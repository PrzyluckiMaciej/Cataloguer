import { useState } from "react";
import { G, css } from "../styles";
import NameFormModal from "./NameFormModal";

export default function TopBar({ tabs, activeTabId, onSwitchTab, onNewTab, onExport, onImport, importRef }) {
  const [showNewTab, setShowNewTab] = useState(false);

  return (
    <>
      <div style={css.topBar}>
        <div style={{ display: "flex", alignItems: "center", paddingRight: 24, marginRight: 12, borderRight: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: G.accent }}>
            Cataloguer
          </span>
        </div>

        {tabs.map((tab) => (
          <button key={tab.id} style={css.tabBtn(tab.id === activeTabId)} onClick={() => onSwitchTab(tab.id)}>
            {tab.name}
          </button>
        ))}

        <button style={{ ...css.tabBtn(false), color: G.textDim }} onClick={() => setShowNewTab(true)}>
          ＋ Tab
        </button>

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
    </>
  );
}