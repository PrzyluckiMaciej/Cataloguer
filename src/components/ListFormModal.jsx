import { useState } from "react";
import { G, css } from "../styles";
import { uid, DEFAULT_TIERS } from "../helpers";
import Modal from "./Modal";

export default function ListFormModal({ list, tabId, onSave, onClose }) {
  const [name, setName] = useState(list?.name || "");
  const [type, setType] = useState(list?.type || "numbered");
  const [tiers, setTiers] = useState(
    list?.tiers || DEFAULT_TIERS.map((t) => ({ id: uid(), label: t }))
  );

  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: list?.id || uid(), name: name.trim(), type, tiers, tabId });
  };

  const addTier = () => setTiers((prev) => [...prev, { id: uid(), label: "New" }]);
  const removeTier = (id) => setTiers((prev) => prev.filter((t) => t.id !== id));
  const renameTier = (id, label) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));

  return (
    <Modal title={list ? "Edit List" : "New List"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div>
          <label style={css.label}>Name</label>
          <input
            style={css.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="List name"
          />
        </div>

        <div>
          <label style={css.label}>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["numbered", "tiered", "unranked"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  ...css.ghostBtn,
                  color: type === t ? G.accent : G.textMuted,
                  borderColor: type === t ? G.accent : G.border,
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {type === "tiered" && (
          <div>
            <label style={css.label}>Tiers</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tiers.map((tier) => (
                <div key={tier.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{
                    width: 28, height: 28,
                    background: G.tierColors[tier.label] || G.accentDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: "bold", color: "#fff", flexShrink: 0,
                  }}>
                    {tier.label.slice(0, 2)}
                  </div>
                  <input
                    style={{ ...css.input, width: 80 }}
                    value={tier.label}
                    onChange={(e) => renameTier(tier.id, e.target.value)}
                  />
                  <button style={css.iconBtn(true)} onClick={() => removeTier(tier.id)}>✕</button>
                </div>
              ))}
              <button style={{ ...css.ghostBtn, alignSelf: "flex-start" }} onClick={addTier}>
                + Add tier
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
          <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={css.primaryBtn} onClick={submit}>Save List</button>
        </div>

      </div>
    </Modal>
  );
}
