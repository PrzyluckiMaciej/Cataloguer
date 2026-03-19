import { useState } from "react";
import { G, css } from "../styles";
import { uid, DEFAULT_TIERS } from "../helpers";
import Modal from "./Modal";

const PRESET_COLORS = [
  "#e05252", // red
  "#e07d52", // orange
  "#e0c052", // yellow
  "#6db86d", // green
  "#52a8e0", // blue
  "#7b6de0", // purple
  "#c06db8", // pink
  "#7a7a7a", // grey
  "#4a9e8e", // teal
  "#c0934a", // brown
];

const DEFAULT_TIER_COLORS = ["#e05252", "#e07d52", "#e0c052", "#6db86d", "#7a7a7a"];

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Swatch button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Pick color"
        style={{
          width: 28, height: 28,
          background: value,
          border: `2px solid ${open ? G.accent : G.border}`,
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s",
        }}
      />

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute", top: 34, left: 0, zIndex: 100,
            background: G.surfaceHigh,
            border: `1px solid ${G.border}`,
            padding: 8,
            display: "grid",
            gridTemplateColumns: "repeat(5, 24px)",
            gap: 5,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => { onChange(color); setOpen(false); }}
              style={{
                width: 24, height: 24,
                background: color,
                border: color === value ? `2px solid ${G.accent}` : `2px solid transparent`,
                cursor: "pointer",
                padding: 0,
                transition: "border-color 0.1s",
              }}
            />
          ))}

          {/* Native color input for custom colors */}
          <label
            title="Custom color"
            style={{
              width: 24, height: 24,
              background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
              border: `2px solid ${G.border}`,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <input
              type="color"
              value={value}
              onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              style={{
                position: "absolute", opacity: 0,
                width: "100%", height: "100%",
                cursor: "pointer",
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function ListFormModal({ list, tabId, onSave, onClose }) {
  const [name, setName] = useState(list?.name || "");
  const [type, setType] = useState(list?.type || "numbered");
  const [tiers, setTiers] = useState(
    list?.tiers
      ? list.tiers.map((t, i) => ({
          color: DEFAULT_TIER_COLORS[i] || "#7a7a7a",
          ...t,  // existing color (if any) wins
        }))
      : DEFAULT_TIERS.map((t, i) => ({ id: uid(), label: t, color: DEFAULT_TIER_COLORS[i] || "#7a7a7a" }))
  );

  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: list?.id || uid(), name: name.trim(), type, tiers, tabId });
  };

  const addTier = () =>
    setTiers((prev) => [...prev, { id: uid(), label: "New", color: "#7a7a7a" }]);

  const removeTier = (id) =>
    setTiers((prev) => prev.filter((t) => t.id !== id));

  const renameTier = (id, label) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));

  const recolorTier = (id, color) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));

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
                  <ColorPicker
                    value={tier.color || G.tierColors?.[tier.label] || G.accentDim}
                    onChange={(color) => recolorTier(tier.id, color)}
                  />
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