import { G, css } from "../styles";
import { useBlobUrl } from "../useAppState";

const THUMB = 200;

export default function ItemCard({
  item, index, listType, rank,
  onDragStart, onDragOver, onDrop, onDragEnd,
  isDragging, isOver,
  onEdit, onDelete, onGallery,
}) {
  const hasMedia = (item.images?.length > 0) || (item.videos?.length > 0);
  const totalMedia = (item.images?.length || 0) + (item.videos?.length || 0);
  const { url: thumbUrl, loading: thumbLoading } = useBlobUrl(item.thumbnail);

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
      {thumbUrl && !thumbLoading && (
        <img 
          key={thumbUrl} // This ensures the img element is recreated when URL changes
          src={thumbUrl} 
          alt="" 
          style={{ width: THUMB, height: THUMB, objectFit: "cover", flexShrink: 0, borderRight: `1px solid ${G.border}` }} 
        />
      )}

      {/* Info + actions */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: thumbUrl ? "16px 18px" : "10px 18px",
        minWidth: 0, gap: 8,
      }}>
        <span style={{ fontSize: thumbUrl ? 18 : 15, letterSpacing: "0.03em", lineHeight: 1.3, wordBreak: "break-word" }}>
          {item.name}
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          {hasMedia && (
            <button
              style={{ ...css.ghostBtn, fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); onGallery(); }}
              title="View media"
            >
              ⧉ {totalMedia} {totalMedia === 1 ? "media" : "media"}
              {item.images?.length > 0 && item.videos?.length > 0 && (
                <span style={{ color: G.textDim, marginLeft: 4 }}>
                  ({item.images.length} img · {item.videos.length} vid)
                </span>
              )}
            </button>
          )}
          <button
            style={{ ...css.ghostBtn, fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit"
          >✎ Edit</button>
          <button
            style={{ ...css.ghostBtn, fontSize: 12, color: G.danger, borderColor: G.dangerDim }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
          >✕ Delete</button>
        </div>
      </div>
    </div>
  );
}