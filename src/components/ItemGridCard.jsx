import { useState } from "react";
import { G, css } from "../styles";

export default function ItemGridCard({
  item, index, listType, rank,
  onDragStart, onDragOver, onDrop, onDragEnd,
  isDragging, isOver,
  onEdit, onDelete, onGallery,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: G.surface,
        border: `1px solid ${isOver ? G.accent : G.border}`,
        borderTop: isOver ? `2px solid ${G.accent}` : `1px solid ${G.border}`,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        transition: "border-color 0.1s, opacity 0.1s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Rank badge */}
      {listType === "numbered" && (
        <div style={{
          position: "absolute", top: 6, left: 6, zIndex: 2,
          background: "rgba(0,0,0,0.65)",
          color: G.accent,
          fontSize: 10, fontFamily: "'Georgia', serif",
          letterSpacing: "0.08em",
          padding: "2px 6px",
          lineHeight: 1.4,
        }}>
          {rank}
        </div>
      )}

      {/* Thumbnail */}
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt=""
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: "100%", aspectRatio: "1 / 1",
          background: G.surfaceHigh,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: G.textDim, fontSize: 11, letterSpacing: "0.08em",
          flexShrink: 0,
        }}>
          NO IMAGE
        </div>
      )}

      {/* Name */}
      <div style={{
        padding: "8px 10px",
        fontSize: 13,
        letterSpacing: "0.02em",
        lineHeight: 1.3,
        color: G.text,
        wordBreak: "break-word",
        borderTop: `1px solid ${G.border}`,
      }}>
        {item.name}
      </div>

      {/* Hover action overlay */}
      {hovered && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8, padding: 12,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.images?.length > 0 && (
            <button
              style={{ ...css.ghostBtn, fontSize: 11, width: "100%" }}
              onClick={() => onGallery()}
            >
              ⧉ {item.images.length} {item.images.length === 1 ? "image" : "images"}
            </button>
          )}
          <button
            style={{ ...css.ghostBtn, fontSize: 11, width: "100%" }}
            onClick={() => onEdit()}
          >
            ✎ Edit
          </button>
          <button
            style={{ ...css.ghostBtn, fontSize: 11, width: "100%", color: G.danger, borderColor: G.dangerDim }}
            onClick={() => onDelete()}
          >
            ✕ Delete
          </button>
        </div>
      )}
    </div>
  );
}