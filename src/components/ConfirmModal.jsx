import { G, css } from "../styles";
import Modal from "./Modal";

export default function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirm" onClose={onClose}>
      <p style={{ color: G.textMuted, marginBottom: 20 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
        <button
          style={{ ...css.primaryBtn, background: G.danger }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
