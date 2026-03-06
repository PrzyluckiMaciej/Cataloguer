import { useState, useEffect } from "react";
import { G } from "../styles";
import Modal from "./Modal";

export default function GalleryModal({ item, onClose }) {
  const [idx, setIdx] = useState(0);
  const images = item.images || [];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]);

  if (!images.length) {
    return (
      <Modal title={item.name} onClose={onClose}>
        <p style={{ color: G.textMuted, fontStyle: "italic" }}>No images attached.</p>
      </Modal>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: `1px solid ${G.border}`,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, letterSpacing: "0.05em", color: G.text }}>
          {item.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: G.textMuted, letterSpacing: "0.08em" }}>
            {idx + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          >✕</button>
        </div>
      </div>

      {/* Main image area */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0 }}>
        <img
          key={idx}
          src={images[idx]}
          alt=""
          style={{
            maxWidth: "100%", maxHeight: "100%",
            objectFit: "contain",
            display: "block",
            padding: "12px 72px",
            boxSizing: "border-box",
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 60,
                background: "transparent", border: "none", color: G.text,
                cursor: "pointer", fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >‹</button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
                background: "transparent", border: "none", color: G.text,
                cursor: "pointer", fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >›</button>
          </>
        )}
      </div>

      {/* Filmstrip */}
      {images.length > 1 && (
        <div style={{
          flexShrink: 0,
          display: "flex", gap: 6, padding: "10px 16px",
          overflowX: "auto", justifyContent: "center",
          borderTop: `1px solid ${G.border}`,
          background: G.surface,
        }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              onClick={() => setIdx(i)}
              style={{
                width: 60, height: 60, objectFit: "cover",
                cursor: "pointer", flexShrink: 0,
                border: i === idx ? `2px solid ${G.accent}` : `2px solid transparent`,
                opacity: i === idx ? 1 : 0.45,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
