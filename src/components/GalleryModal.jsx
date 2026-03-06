import { useState } from "react";
import { G } from "../styles";
import Modal from "./Modal";

export default function GalleryModal({ item, onClose }) {
  const [idx, setIdx] = useState(0);
  const images = item.images || [];

  if (!images.length) {
    return (
      <Modal title={item.name} onClose={onClose}>
        <p style={{ color: G.textMuted, fontStyle: "italic" }}>No images attached.</p>
      </Modal>
    );
  }

  return (
    <Modal title={item.name} onClose={onClose}>
      <div style={{ position: "relative", background: G.bg, marginBottom: 12, textAlign: "center" }}>
        <img
          src={images[idx]}
          alt=""
          style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", display: "block", margin: "0 auto" }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              style={{
                position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)", color: G.text, border: "none",
                padding: "8px 14px", cursor: "pointer", fontSize: 18,
              }}
            >‹</button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              style={{
                position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)", color: G.text, border: "none",
                padding: "8px 14px", cursor: "pointer", fontSize: 18,
              }}
            >›</button>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            onClick={() => setIdx(i)}
            style={{
              width: 52, height: 52, objectFit: "cover", cursor: "pointer",
              border: i === idx ? `2px solid ${G.accent}` : `2px solid ${G.border}`,
              opacity: i === idx ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: G.textMuted, textAlign: "right" }}>
        {idx + 1} / {images.length}
      </div>
    </Modal>
  );
}
