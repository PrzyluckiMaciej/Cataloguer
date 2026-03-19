import { useEffect } from "react";
import { G, css } from "../styles";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{ ...css.modal, cursor: "default" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...css.modalBox, cursor: "default" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${G.border}`,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: "normal", letterSpacing: "0.05em", margin: 0 }}>
            {title}
          </h2>
          <button style={css.iconBtn(false)} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}