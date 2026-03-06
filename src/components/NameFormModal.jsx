import { useState } from "react";
import { css } from "../styles";
import Modal from "./Modal";

export default function NameFormModal({ title, initial, onSave, onClose }) {
  const [name, setName] = useState(initial || "");

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={css.label}>Name</label>
          <input
            style={css.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
            autoFocus
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={css.primaryBtn} onClick={() => name.trim() && onSave(name.trim())}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
