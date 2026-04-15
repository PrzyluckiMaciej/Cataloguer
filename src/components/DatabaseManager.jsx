import { useState } from "react";
import { G, css } from "../styles";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";

export default function DatabaseManager({ databases, activeDbId, onSwitch, onCreate, onRename, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirm, setConfirm] = useState(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
  };

  const startEdit = (db) => {
    setEditingId(db.id);
    setEditName(db.name);
  };

  const commitEdit = () => {
    if (editName.trim() && editingId) onRename(editingId, editName.trim());
    setEditingId(null);
    setEditName("");
  };

  return (
    <>
      <Modal title="Databases" onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 360 }}>

          {/* Database list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(databases || []).map((db) => {
              const isActive = db.id === activeDbId;
              const isEditing = editingId === db.id;
              return (
                <div
                  key={db.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px",
                    background: isActive ? "rgba(232,213,163,0.08)" : G.surface,
                    border: `1px solid ${isActive ? G.accentDim : G.border}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {/* Active indicator */}
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: isActive ? G.accent : "transparent",
                    border: `1px solid ${isActive ? G.accent : G.border}`,
                    transition: "background 0.15s",
                  }} />

                  {/* Name / edit field */}
                  {isEditing ? (
                    <input
                      autoFocus
                      style={{ ...css.input, flex: 1, fontSize: 13, padding: "3px 6px" }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={commitEdit}
                    />
                  ) : (
                    <span
                      style={{ flex: 1, fontSize: 13, letterSpacing: "0.03em", color: isActive ? G.text : G.textMuted, cursor: isActive ? "default" : "pointer" }}
                      onClick={() => !isActive && onSwitch(db.id)}
                    >
                      {db.name}
                    </span>
                  )}

                  {/* Actions */}
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {!isActive && (
                        <button
                          style={{ ...css.ghostBtn, fontSize: 11, padding: "2px 8px" }}
                          onClick={() => onSwitch(db.id)}
                        >
                          Open
                        </button>
                      )}
                      <button
                        style={{ ...css.iconBtn(false), fontSize: 12 }}
                        title="Rename"
                        onClick={() => startEdit(db)}
                      >✎</button>
                      {databases.length > 1 && (
                        <button
                          style={{ ...css.iconBtn(true), fontSize: 12 }}
                          title="Delete database"
                          onClick={() => setConfirm(db)}
                        >✕</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: G.border }} />

          {/* Create new database */}
          <div>
            <label style={{ ...css.label, marginBottom: 6, display: "block" }}>New database</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...css.input, flex: 1 }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Database name…"
              />
              <button
                style={{ ...css.primaryBtn, opacity: newName.trim() ? 1 : 0.5 }}
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                Create
              </button>
            </div>
          </div>

        </div>
      </Modal>

      {confirm && (
        <ConfirmModal
          message={`Delete database "${confirm.name}" and all its data? This cannot be undone.`}
          onConfirm={() => { onDelete(confirm.id); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}