import { useState, useEffect, useRef } from "react";
import { G, css } from "../styles";
import EditableText from "./EditableText";
import ItemGridCard from "./ItemGridCard";
import ItemCard from "./ItemCard";
import ItemFormModal from "./ItemFormModal";
import ListFormModal from "./ListFormModal";
import GalleryModal from "./GalleryModal";
import ConfirmModal from "./ConfirmModal";

const COL_OPTIONS = [2, 3, 4, 5, 6];

// Grid / row toggle button
function ViewToggle({ value, onChange }) {
  const btn = (mode, label, title) => (
    <button
      title={title}
      onClick={() => onChange(mode)}
      style={{
        fontFamily: "'Georgia', serif",
        fontSize: 13,
        width: 30, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: value === mode ? G.accent : "none",
        color: value === mode ? G.bg : G.textMuted,
        border: `1px solid ${value === mode ? G.accent : G.border}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {btn("grid", "⊞", "Grid view")}
      {btn("rows", "☰", "Row view")}
    </div>
  );
}

export default function ListView({ list, items, onUpdate, onDelete, onItemCreate, onItemUpdate, onItemDelete }) {
  const [modal, setModal] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [cols, setCols] = useState(list.cols ?? 4);
  const [viewMode, setViewMode] = useState(list.viewMode ?? "grid");

  const setAndSaveCols = (n) => { setCols(n); onUpdate({ ...list, cols: n, viewMode }); };
  const setAndSaveViewMode = (m) => { setViewMode(m); onUpdate({ ...list, viewMode: m, cols }); };

  const listItems = items.filter((it) => it.listId === list.id);

  const [tierItems, setTierItems] = useState(() => {
    if (list.type !== "tiered") return {};
    const map = {};
    list.tiers.forEach((t) => { map[t.id] = listItems.filter((it) => it.tierId === t.id); });
    return map;
  });

  useEffect(() => {
    if (list.type !== "tiered") return;
    const map = {};
    list.tiers.forEach((t) => { map[t.id] = listItems.filter((it) => it.tierId === t.id); });
    setTierItems(map);
  }, [items, list]);

  const tierDrag = useRef({ tierId: null, idx: null });
  const tierOver = useRef({ tierId: null, idx: null });

  const handleDragStart = (e, idx) => setDragIdx(idx);
  const handleDragOver = (idx) => setOverIdx(idx);
  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const sorted = [...listItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    reordered.forEach((it, i) => onItemUpdate({ ...it, order: i }));
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleTierDrop = (toTierId, toIdx) => {
    const { tierId: fromTierId, idx: fromIdx } = tierDrag.current;
    if (fromTierId === null) return;
    const srcItems = [...(tierItems[fromTierId] || [])];
    const [moved] = srcItems.splice(fromIdx, 1);
    const destItems = fromTierId === toTierId ? srcItems : [...(tierItems[toTierId] || [])];
    destItems.splice(toIdx, 0, moved);
    onItemUpdate({ ...moved, tierId: toTierId });
    tierDrag.current = { tierId: null, idx: null };
    tierOver.current = { tierId: null, idx: null };
  };

  const sorted = [...listItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, marginBottom: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${G.border}`, background: G.surfaceHigh }}>
        <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: G.accentDim, border: `1px solid ${G.accentDim}`, padding: "2px 7px" }}>
          {list.type}
        </span>
        <EditableText
          value={list.name}
          onSave={(n) => onUpdate({ ...list, name: n })}
          style={{ fontSize: 15, letterSpacing: "0.04em", flex: 1 }}
        />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={() => setModal("newItem")}>+ Add item</button>
          <button style={css.iconBtn(false)} onClick={() => setModal("editList")} title="Edit list">⚙</button>
          <button style={css.iconBtn(true)} onClick={() => setModal({ type: "confirm", msg: `Delete list "${list.name}" and all its items?`, fn: onDelete })} title="Delete list">✕</button>
        </div>
      </div>

      {/* Toolbar — view toggle + column control */}
      {list.type !== "tiered" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: `1px solid ${G.border}`, background: G.bg }}>
          <ViewToggle value={viewMode} onChange={setAndSaveViewMode} />
          {viewMode === "grid" && (
            <>
              <div style={{ width: 1, height: 20, background: G.border }} />
              <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: G.textDim }}>
                Columns
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {COL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setAndSaveCols(n)}
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: 12,
                      width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: cols === n ? G.accent : "none",
                      color: cols === n ? G.bg : G.textMuted,
                      border: `1px solid ${cols === n ? G.accent : G.border}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tiered layout */}
      {list.type === "tiered" ? (
        <div>
          {list.tiers.map((tier) => {
            const tItems = tierItems[tier.id] || [];
            return (
              <div key={tier.id} style={{ display: "flex", borderBottom: `1px solid ${G.border}`, minHeight: 52 }}>
                <div style={{ width: 44, background: G.tierColors[tier.label] || G.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#fff", flexShrink: 0 }}>
                  {tier.label.slice(0, 2)}
                </div>
                <div
                  style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 0, padding: 4, alignContent: "flex-start", minHeight: 52 }}
                  onDragOver={(e) => { e.preventDefault(); tierOver.current = { tierId: tier.id, idx: tItems.length }; }}
                  onDrop={(e) => { e.preventDefault(); handleTierDrop(tier.id, tierOver.current.idx); }}
                >
                  {tItems.map((item, i) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => { tierDrag.current = { tierId: tier.id, idx: i }; }}
                      onDragOver={(e) => { e.preventDefault(); tierOver.current = { tierId: tier.id, idx: i }; }}
                      onDrop={(e) => { e.preventDefault(); handleTierDrop(tier.id, i); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px", cursor: "grab" }}
                    >
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" style={{ width: 48, height: 48, objectFit: "cover", border: `1px solid ${G.border}` }} />
                        : <div style={{ width: 48, height: 48, background: G.surfaceHigh, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 9 }}>IMG</div>
                      }
                      <span style={{ fontSize: 10, color: G.textMuted, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{item.name}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {item.images?.length > 0 && (
                          <button style={{ ...css.iconBtn(false), fontSize: 9, padding: "1px 3px" }} onClick={() => setModal({ type: "gallery", item })}>⧉</button>
                        )}
                        <button style={{ ...css.iconBtn(false), fontSize: 9, padding: "1px 3px" }} onClick={() => setModal({ type: "editItem", item })}>✎</button>
                        <button style={{ ...css.iconBtn(true), fontSize: 9, padding: "1px 3px" }} onClick={() => setModal({ type: "confirm", msg: `Delete "${item.name}"?`, fn: () => onItemDelete(item.id) })}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid layout */
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 1,
          background: G.border,
          padding: sorted.length === 0 ? 0 : 1,
        }}>
          {sorted.map((item, i) => (
            <ItemGridCard
              key={item.id}
              item={item}
              index={i}
              listType={list.type}
              rank={i + 1}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              isDragging={dragIdx === i}
              isOver={overIdx === i}
              onEdit={() => setModal({ type: "editItem", item })}
              onDelete={() => setModal({ type: "confirm", msg: `Delete "${item.name}"?`, fn: () => onItemDelete(item.id) })}
              onGallery={() => setModal({ type: "gallery", item })}
            />
          ))}
          {sorted.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "18px 16px", color: G.textDim, fontSize: 13, fontStyle: "italic", background: G.surface }}>
              No items yet.
            </div>
          )}
        </div>
      ) : (
        /* Row layout */
        <div>
          {sorted.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              index={i}
              listType={list.type}
              rank={i + 1}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              isDragging={dragIdx === i}
              isOver={overIdx === i}
              onEdit={() => setModal({ type: "editItem", item })}
              onDelete={() => setModal({ type: "confirm", msg: `Delete "${item.name}"?`, fn: () => onItemDelete(item.id) })}
              onGallery={() => setModal({ type: "gallery", item })}
            />
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: "18px 16px", color: G.textDim, fontSize: 13, fontStyle: "italic" }}>
              No items yet.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === "editList" && (
        <ListFormModal
          list={list}
          tabId={list.tabId}
          onSave={(updated) => { onUpdate(updated); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "newItem" && (
        <ItemFormModal
          listId={list.id}
          onSave={(item) => {
            onItemCreate({
              ...item,
              tierId: list.type === "tiered" && list.tiers.length ? list.tiers[list.tiers.length - 1].id : undefined,
              order: listItems.length,
            });
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "editItem" && (
        <ItemFormModal
          item={modal.item}
          listId={list.id}
          onSave={(item) => { onItemUpdate(item); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "gallery" && (
        <GalleryModal item={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}
    </div>
  );
}