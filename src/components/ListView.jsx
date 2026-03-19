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
const TIER_THUMB = 100; // thumbnail size for tiered list items

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
  const [query, setQuery] = useState("");

  const setAndSaveCols = (n) => { setCols(n); onUpdate({ ...list, cols: n, viewMode }); };
  const setAndSaveViewMode = (m) => { setViewMode(m); onUpdate({ ...list, viewMode: m, cols }); };

  const listItems = items.filter((it) => it.listId === list.id);

  const [tierItems, setTierItems] = useState(() => {
    if (list.type !== "tiered") return {};
    const map = {};
    list.tiers.forEach((t) => {
      map[t.id] = listItems
        .filter((it) => it.tierId === t.id)
        .sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0));
    });
    return map;
  });

  useEffect(() => {
    if (list.type !== "tiered") return;
    const map = {};
    list.tiers.forEach((t) => {
      map[t.id] = listItems
        .filter((it) => it.tierId === t.id)
        .sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0));
    });
    setTierItems(map);
  }, [items, list, listItems]);

  const tierDrag = useRef({ tierId: undefined, idx: null });
  const tierOver = useRef({ tierId: undefined, idx: null });

  // Tier row reordering
  const [dragTierIdx, setDragTierIdx] = useState(null);
  const [overTierIdx, setOverTierIdx] = useState(null);

  const handleTierRowDrop = (toIdx) => {
    if (dragTierIdx === null || dragTierIdx === toIdx) {
      setDragTierIdx(null);
      setOverTierIdx(null);
      return;
    }
    const reordered = [...list.tiers];
    const [moved] = reordered.splice(dragTierIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onUpdate({ ...list, tiers: reordered });
    setDragTierIdx(null);
    setOverTierIdx(null);
  };

  const handleDragStart = (e, idx) => setDragIdx(idx);
  const handleDragOver = (idx) => setOverIdx(idx);
  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    reordered.forEach((it, i) => onItemUpdate({ ...it, order: i }));
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleTierDrop = (toTierId, toIdx) => {
    const { tierId: fromTierId, idx: fromIdx } = tierDrag.current;
    if (fromTierId === undefined) return;
    if (fromTierId === toTierId && fromIdx === toIdx) return;

    const getItems = (tid) =>
      tid === null
        ? [...listItems.filter((it) => !it.tierId)].sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0))
        : [...(tierItems[tid] || [])];

    const srcItems = getItems(fromTierId);
    const [moved] = srcItems.splice(fromIdx, 1);

    const destItems = fromTierId === toTierId ? srcItems : getItems(toTierId);
    destItems.splice(toIdx, 0, moved);

    // Save the full reordered destination with tierOrder, plus tierId change if crossing tiers
    destItems.forEach((it, i) => onItemUpdate({ ...it, tierId: toTierId ?? null, tierOrder: i }));

    // If moving between tiers, also rewrite the source tier's order
    if (fromTierId !== toTierId) {
      srcItems.forEach((it, i) => onItemUpdate({ ...it, tierOrder: i }));
    }

    tierDrag.current = { tierId: undefined, idx: null };
    tierOver.current = { tierId: undefined, idx: null };
  };

  const handleItemSave = (item, reorderedItems) => {
    if (reorderedItems) {
      reorderedItems.forEach((it) => onItemUpdate(it));
    } else {
      onItemUpdate(item);
    }
    setModal(null);
  };

  const sorted = [...listItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const filtered = query.trim()
    ? sorted.filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
    : sorted;
  const isFiltering = query.trim().length > 0;

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

      {/* Toolbar — view toggle + column control + search */}
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
          {/* Search */}
          <div style={{ marginLeft: "auto", position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 8, color: G.textDim, fontSize: 12, pointerEvents: "none" }}>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              style={{
                ...css.input,
                width: 180,
                paddingLeft: 24,
                paddingTop: 5,
                paddingBottom: 5,
                fontSize: 12,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ ...css.iconBtn(false), position: "absolute", right: 4, fontSize: 11, padding: "2px 4px" }}
              >✕</button>
            )}
          </div>
        </div>
      )}

      {/* Tiered layout */}
      {list.type === "tiered" ? (
        <div>
          {list.tiers.map((tier, tierIdx) => {
            const tierColor = tier.color || G.tierColors?.[tier.label] || G.accentDim;
            const tItems = tierItems[tier.id] || [];
            const isDraggingThisTier = dragTierIdx === tierIdx;
            const isOverThisTier = overTierIdx === tierIdx && dragTierIdx !== tierIdx;
            return (
              <div
                key={tier.id}
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${G.border}`,
                  borderTop: isOverThisTier ? `2px solid ${G.accent}` : "2px solid transparent",
                  minHeight: TIER_THUMB + 4,
                  opacity: isDraggingThisTier ? 0.4 : 1,
                  transition: "opacity 0.1s, border-color 0.1s",
                }}
                onDragOver={(e) => { e.preventDefault(); setOverTierIdx(tierIdx); }}
                onDrop={(e) => { e.preventDefault(); handleTierRowDrop(tierIdx); }}
              >
                <div
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragTierIdx(tierIdx); }}
                  onDragEnd={() => { setDragTierIdx(null); setOverTierIdx(null); }}
                  title="Drag to reorder tier"
                  style={{
                    width: 44,
                    background: tierColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: "bold", color: "#fff", flexShrink: 0,
                    cursor: "grab",
                    userSelect: "none",
                    position: "relative",
                  }}
                >
                  {tier.label.slice(0, 2)}
                  <span style={{
                    position: "absolute", bottom: 4,
                    fontSize: 10, opacity: 0.6, letterSpacing: 0,
                    lineHeight: 1,
                  }}>⠿</span>
                </div>
                <div
                  style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 0, padding: 4, alignContent: "flex-start", minHeight: 52 }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); tierOver.current = { tierId: tier.id, idx: tItems.length }; }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleTierDrop(tier.id, tierOver.current.idx); }}
                >
                  {tItems.map((item, i) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); tierDrag.current = { tierId: tier.id, idx: i }; }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); tierOver.current = { tierId: tier.id, idx: i }; }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleTierDrop(tier.id, i); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px", cursor: "grab" }}
                    >
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" style={{ width: TIER_THUMB, height: TIER_THUMB, objectFit: "cover", border: `1px solid ${G.border}` }} />
                        : <div style={{ width: TIER_THUMB, height: TIER_THUMB, background: G.surfaceHigh, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 9 }}>IMG</div>
                      }
                      <span style={{ fontSize: 10, color: G.textMuted, maxWidth: TIER_THUMB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{item.name}</span>
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

          {/* Unranked pool */}
          {(() => {
            const unrankedItems = listItems.filter((it) => !it.tierId);
            return (
              <div style={{ borderTop: `2px dashed ${G.border}` }}>
                {/* Unranked header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  background: G.bg,
                  borderBottom: `1px solid ${G.border}`,
                }}>
                  <span style={{
                    fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                    color: G.textDim,
                  }}>
                    Unranked
                  </span>
                  <span style={{ fontSize: 11, color: G.textDim }}>
                    — drag into a tier to rank
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: G.textDim }}>
                    {unrankedItems.length} {unrankedItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  style={{
                    display: "flex", flexWrap: "wrap", gap: 0, padding: 4,
                    alignContent: "flex-start", minHeight: 72,
                    background: G.surface,
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); tierOver.current = { tierId: null, idx: unrankedItems.length }; }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleTierDrop(null, tierOver.current.idx); }}
                >
                  {unrankedItems.length === 0 && (
                    <div style={{
                      width: "100%", padding: "16px 12px",
                      color: G.textDim, fontSize: 12, fontStyle: "italic",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      No unranked items — new items will appear here
                    </div>
                  )}
                  {unrankedItems.map((item, i) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); tierDrag.current = { tierId: null, idx: i }; }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); tierOver.current = { tierId: null, idx: i }; }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleTierDrop(null, i); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px", cursor: "grab", opacity: 0.85 }}
                    >
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" style={{ width: TIER_THUMB, height: TIER_THUMB, objectFit: "cover", border: `1px solid ${G.border}` }} />
                        : <div style={{ width: TIER_THUMB, height: TIER_THUMB, background: G.surfaceHigh, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 9 }}>IMG</div>
                      }
                      <span style={{ fontSize: 10, color: G.textMuted, maxWidth: TIER_THUMB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{item.name}</span>
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
          })()}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid layout */
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 1,
          background: G.border,
          padding: filtered.length === 0 ? 0 : 1,
        }}>
          {filtered.map((item, i) => (
            <ItemGridCard
              key={item.id}
              item={item}
              index={i}
              listType={list.type}
              rank={sorted.indexOf(item) + 1}
              onDragStart={isFiltering ? () => {} : handleDragStart}
              onDragOver={isFiltering ? () => {} : handleDragOver}
              onDrop={isFiltering ? () => {} : handleDrop}
              onDragEnd={isFiltering ? () => {} : () => { setDragIdx(null); setOverIdx(null); }}
              isDragging={!isFiltering && dragIdx === i}
              isOver={!isFiltering && overIdx === i}
              onEdit={() => setModal({ type: "editItem", item })}
              onDelete={() => setModal({ type: "confirm", msg: `Delete "${item.name}"?`, fn: () => onItemDelete(item.id) })}
              onGallery={() => setModal({ type: "gallery", item })}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "18px 16px", color: G.textDim, fontSize: 13, fontStyle: "italic", background: G.surface }}>
              {isFiltering ? `No items match "${query}"` : "No items yet."}
            </div>
          )}
        </div>
      ) : (
        /* Row layout */
        <div>
          {filtered.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              index={i}
              listType={list.type}
              rank={sorted.indexOf(item) + 1}
              onDragStart={isFiltering ? () => {} : handleDragStart}
              onDragOver={isFiltering ? () => {} : handleDragOver}
              onDrop={isFiltering ? () => {} : handleDrop}
              onDragEnd={isFiltering ? () => {} : () => { setDragIdx(null); setOverIdx(null); }}
              isDragging={!isFiltering && dragIdx === i}
              isOver={!isFiltering && overIdx === i}
              onEdit={() => setModal({ type: "editItem", item })}
              onDelete={() => setModal({ type: "confirm", msg: `Delete "${item.name}"?`, fn: () => onItemDelete(item.id) })}
              onGallery={() => setModal({ type: "gallery", item })}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "18px 16px", color: G.textDim, fontSize: 13, fontStyle: "italic" }}>
              {isFiltering ? `No items match "${query}"` : "No items yet."}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === "editList" && (
        <ListFormModal
          list={list}
          tabId={list.tabId}
          onSave={(updated) => {
            if (updated.type === "tiered" && list.type === "tiered") {
              const newTierIds = new Set(updated.tiers.map((t) => t.id));
              listItems.forEach((it) => {
                if (it.tierId && !newTierIds.has(it.tierId)) {
                  onItemUpdate({ ...it, tierId: null, tierOrder: undefined });
                }
              });
            }
            onUpdate(updated);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "newItem" && (
        <ItemFormModal
          listId={list.id}
          listItems={sorted}
          onSave={(item) => {
            onItemCreate({
              ...item,
              tierId: null,
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
          listItems={sorted}
          onSave={handleItemSave}
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