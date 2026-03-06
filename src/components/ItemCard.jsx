import { G, css } from "../styles";

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
        display: "flex", alignItems: "center", gap: 12,
        padding: "9px 12px",
        background: isDragging ? G.surfaceHigh : isOver ? "#1a1a1a" : "transparent",
        borderTop: isOver ? `2px solid ${G.accent}` : "2px solid transparent",
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab", transition: "background 0.1s",
        borderBottom: `1px solid ${G.border}`,
      }}
    >
      <span style={{ color: G.textDim, fontSize: 11, minWidth: 20, textAlign: "right", flexShrink: 0 }}>
        {listType === "numbered" ? rank : "·"}
      </span>

      {item.thumbnail
        ? <img src={item.thumbnail} alt="" style={{ width: 36, height: 36, objectFit: "cover", flexShrink: 0, border: `1px solid ${G.border}` }} />
        : <div style={{ width: 36, height: 36, background: G.surfaceHigh, flexShrink: 0, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 10 }}>IMG</div>
      }

      <span style={{ flex: 1, fontSize: 14, letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.name}
      </span>

      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {item.images?.length > 0 && (
          <button
            style={{ ...css.iconBtn(false), fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); onGallery(); }}
            title="View gallery"
          >
            ⧉ {item.images.length}
          </button>
        )}
        <button style={css.iconBtn(false)} onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit">✎</button>
        <button style={css.iconBtn(true)} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">✕</button>
      </div>
    </div>
  );
}
