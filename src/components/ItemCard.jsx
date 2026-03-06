import { G, css } from "../styles";

const THUMB = 200;

export default function ItemCard({
  item, index, listType, rank,
  onDragStart, onDragOver, onDrop, onDragEnd,
  isDragging, isOver,
  onEdit, onDelete, onGallery,
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      onDragEnd={onDragEnd}
      style={{
        display: "flex", alignItems: "stretch", gap: 0,
        background: isDragging ? G.surfaceHigh : isOver ? "#1a1a1a" : "transparent",
        borderTop: isOver ? `2px solid ${G.accent}` : "2px solid transparent",
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab", transition: "background 0.1s",
        borderBottom: `1px solid ${G.border}`,
      }}
    >
      {/* Rank badge */}
      <div style={{
        width: 36, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: G.textDim, fontSize: 13,
        borderRight: `1px solid ${G.border}`,
      }}>
        {listType === "numbered" ? rank : "·"}
      </div>

      {/* Thumbnail */}
      {item.thumbnail
        ? <img src={item.thumbnail} alt="" style={{ width: THUMB, height: THUMB, objectFit: "cover", flexShrink: 0, borderRight: `1px solid ${G.border}` }} />
        : <div style={{ width: THUMB, height: THUMB, background: G.surfaceHigh, flexShrink: 0, borderRight: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 11, letterSpacing: "0.1em" }}>NO IMAGE</div>
      }

      {/* Info + actions */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 18px", minWidth: 0 }}>
        <span style={{ fontSize: 18, letterSpacing: "0.03em", lineHeight: 1.3, wordBreak: "break-word" }}>
          {item.name}
        </span>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {item.images?.length > 0 && (
            <button
              style={{ ...css.ghostBtn, fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); onGallery(); }}
              title="View gallery"
            >
              ⧉ {item.images.length} {item.images.length === 1 ? "image" : "images"}
            </button>
          )}
          <button
            style={css.ghostBtn}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit"
          >✎ Edit</button>
          <button
            style={{ ...css.ghostBtn, color: G.danger, borderColor: G.dangerDim }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
          >✕ Delete</button>
        </div>
      </div>
    </div>
  );
}
