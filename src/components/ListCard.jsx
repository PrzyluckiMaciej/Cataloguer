import { useState } from "react";
import { G, css } from "../styles";
import ListFormModal from "./ListFormModal";
import ConfirmModal from "./ConfirmModal";

export default function ListCard({ list, itemCount, onSelect, onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver }) {
  const [modal, setModal] = useState(null);

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(); }}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? G.surfaceHigh : G.surface,
        border: `1px solid ${G.border}`,
        borderTop: isOver ? `2px solid ${G.accent}` : `1px solid ${G.border}`,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        cursor: "pointer",
        opacity: isDragging ? 0.4 : 1,
        transition: "background 0.12s, border-color 0.12s",
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.background = G.surfaceHigh;
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.background = G.surface;
      }}
    >
      {/* Drag handle */}
      <span
        style={{ color: G.textDim, fontSize: 14, cursor: "grab", flexShrink: 0, padding: "0 2px", lineHeight: 1 }}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >⠿</span>
      {/* Type badge */}
      <span style={{
        fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
        color: G.accentDim, border: `1px solid ${G.accentDim}`,
        padding: "2px 7px", flexShrink: 0,
      }}>
        {list.type}
      </span>

      {/* Name */}
      <span style={{ fontSize: 16, letterSpacing: "0.04em", flex: 1 }}>
        {list.name}
      </span>

      {/* Item count */}
      <span style={{ fontSize: 12, color: G.textDim, flexShrink: 0 }}>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </span>

      {/* Arrow */}
      <span style={{ color: G.textDim, fontSize: 16, flexShrink: 0, marginLeft: 4 }}>›</span>

      {/* Actions — stop propagation so clicks don't open the list */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          style={css.iconBtn(false)}
          onClick={() => setModal("editList")}
          title="Edit list settings"
        >⚙</button>
        <button
          style={css.iconBtn(true)}
          onClick={() => setModal({ type: "confirm", msg: `Delete list "${list.name}" and all its items?`, fn: onDelete })}
          title="Delete list"
        >✕</button>
      </div>

      {/* Modals */}
      {modal === "editList" && (
        <ListFormModal
          list={list}
          tabId={list.tabId}
          onSave={(updated) => { onUpdate(updated); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
