
import { useState, useEffect, useRef, useCallback } from "react";

// ─── IndexedDB wrapper ──────────────────────────────────────────────────────
const DB_NAME = "CatalogueApp";
const DB_VERSION = 1;
let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("store")) {
        db.createObjectStore("store");
      }
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readonly");
    const req = tx.objectStore("store").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readwrite");
    const req = tx.objectStore("store").put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

const DEFAULT_TIERS = ["S", "A", "B", "C", "D"];

function emptyState() {
  const tabId = uid();
  const catId = uid();
  return {
    tabs: [{ id: tabId, name: "My Collection" }],
    catalogues: [{ id: catId, tabId, name: "General" }],
    lists: [],
    items: [],
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const G = {
  bg: "#0e0e0e",
  surface: "#161616",
  surfaceHigh: "#1f1f1f",
  border: "#2a2a2a",
  borderLight: "#333",
  accent: "#e8d5a3",
  accentDim: "#8a7a55",
  text: "#f0ede6",
  textMuted: "#888",
  textDim: "#555",
  danger: "#c0392b",
  dangerDim: "#7a1f18",
  tierColors: {
    S: "#c0392b", A: "#e67e22", B: "#f1c40f",
    C: "#27ae60", D: "#2980b9", E: "#8e44ad", F: "#555"
  },
};

const css = {
  app: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: G.bg,
    color: G.text,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
  },
  topBar: {
    background: G.surface,
    borderBottom: `1px solid ${G.border}`,
    padding: "0 24px",
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    height: 52,
  },
  tabBtn: (active) => ({
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: active ? G.accent : G.textMuted,
    background: "none",
    border: "none",
    borderBottom: active ? `2px solid ${G.accent}` : "2px solid transparent",
    padding: "0 20px",
    cursor: "pointer",
    transition: "color 0.2s",
    whiteSpace: "nowrap",
  }),
  iconBtn: (danger) => ({
    background: "none",
    border: "none",
    color: danger ? G.danger : G.textDim,
    cursor: "pointer",
    padding: "4px 6px",
    fontSize: 14,
    lineHeight: 1,
    borderRadius: 3,
    transition: "color 0.15s",
  }),
  primaryBtn: {
    fontFamily: "'Georgia', serif",
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    background: G.accent,
    color: G.bg,
    border: "none",
    padding: "7px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  ghostBtn: {
    fontFamily: "'Georgia', serif",
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    background: "none",
    color: G.textMuted,
    border: `1px solid ${G.border}`,
    padding: "6px 14px",
    cursor: "pointer",
  },
  input: {
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    background: G.surfaceHigh,
    color: G.text,
    border: `1px solid ${G.border}`,
    padding: "7px 10px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: G.textMuted,
    display: "block",
    marginBottom: 5,
  },
  modal: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalBox: {
    background: G.surface,
    border: `1px solid ${G.border}`,
    padding: 28,
    minWidth: 340,
    maxWidth: 560,
    width: "90vw",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "normal",
    letterSpacing: "0.05em",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: `1px solid ${G.border}`,
  },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div style={css.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={css.modalBox}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${G.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: "normal", letterSpacing: "0.05em", margin: 0 }}>{title}</h2>
          <button style={css.iconBtn(false)} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Inline editable text ─────────────────────────────────────────────────────
function EditableText({ value, onSave, style, placeholder = "Untitled" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef();
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);
  const commit = () => { setEditing(false); if (draft.trim()) onSave(draft.trim()); else setDraft(value); };
  if (!editing) return (
    <span style={{ ...style, cursor: "text" }} onDoubleClick={() => { setDraft(value); setEditing(true); }}>
      {value || placeholder}
    </span>
  );
  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      style={{ ...style, background: G.surfaceHigh, border: `1px solid ${G.accentDim}`, color: G.text, padding: "2px 4px", fontFamily: "inherit", fontSize: "inherit", outline: "none" }}
    />
  );
}

// ─── Image Gallery Modal ──────────────────────────────────────────────────────
function GalleryModal({ item, onClose }) {
  const [idx, setIdx] = useState(0);
  const images = item.images || [];
  if (!images.length) return (
    <Modal title={item.name} onClose={onClose}>
      <p style={{ color: G.textMuted, fontStyle: "italic" }}>No images attached.</p>
    </Modal>
  );
  return (
    <Modal title={item.name} onClose={onClose}>
      <div style={{ position: "relative", background: G.bg, marginBottom: 12, textAlign: "center" }}>
        <img src={images[idx]} alt="" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", display: "block", margin: "0 auto" }} />
        {images.length > 1 && (
          <>
            <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", color: G.text, border: "none", padding: "8px 14px", cursor: "pointer", fontSize: 18 }}>‹</button>
            <button onClick={() => setIdx((i) => (i + 1) % images.length)}
              style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", color: G.text, border: "none", padding: "8px 14px", cursor: "pointer", fontSize: 18 }}>›</button>
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => setIdx(i)}
            style={{ width: 52, height: 52, objectFit: "cover", cursor: "pointer", border: i === idx ? `2px solid ${G.accent}` : `2px solid ${G.border}`, opacity: i === idx ? 1 : 0.5 }} />
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: G.textMuted, textAlign: "right" }}>{idx + 1} / {images.length}</div>
    </Modal>
  );
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────
function ItemFormModal({ item, listId, onSave, onClose }) {
  const [name, setName] = useState(item?.name || "");
  const [thumbnail, setThumbnail] = useState(item?.thumbnail || null);
  const [images, setImages] = useState(item?.images || []);
  const thumbRef = useRef();
  const imgsRef = useRef();

  const handleThumb = async (e) => {
    const f = e.target.files[0];
    if (f) setThumbnail(await fileToBase64(f));
  };
  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    const b64s = await Promise.all(files.map(fileToBase64));
    setImages((prev) => [...prev, ...b64s]);
  };
  const removeImage = (i) => setImages((prev) => prev.filter((_, j) => j !== i));

  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: item?.id || uid(), name: name.trim(), thumbnail, images, listId });
  };

  return (
    <Modal title={item ? "Edit Item" : "New Item"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={css.label}>Name</label>
          <input style={css.input} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus placeholder="Item name" />
        </div>
        <div>
          <label style={css.label}>Thumbnail</label>
          {thumbnail && <img src={thumbnail} alt="" style={{ width: 80, height: 80, objectFit: "cover", display: "block", marginBottom: 8, border: `1px solid ${G.border}` }} />}
          <button style={css.ghostBtn} onClick={() => thumbRef.current.click()}>
            {thumbnail ? "Replace" : "Upload thumbnail"}
          </button>
          {thumbnail && <button style={{ ...css.ghostBtn, marginLeft: 8 }} onClick={() => setThumbnail(null)}>Remove</button>}
          <input ref={thumbRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} />
        </div>
        <div>
          <label style={css.label}>Images ({images.length})</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {images.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: 60, height: 60, objectFit: "cover", border: `1px solid ${G.border}` }} />
                <button onClick={() => removeImage(i)}
                  style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.8)", color: G.text, border: "none", width: 18, height: 18, cursor: "pointer", fontSize: 10, padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <button style={css.ghostBtn} onClick={() => imgsRef.current.click()}>Add images</button>
          <input ref={imgsRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImages} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
          <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={css.primaryBtn} onClick={submit}>Save Item</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── List Form Modal ──────────────────────────────────────────────────────────
function ListFormModal({ list, catalogueId, onSave, onClose }) {
  const [name, setName] = useState(list?.name || "");
  const [type, setType] = useState(list?.type || "numbered");
  const [tiers, setTiers] = useState(list?.tiers || DEFAULT_TIERS.map((t) => ({ id: uid(), label: t })));
  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: list?.id || uid(), name: name.trim(), type, tiers, catalogueId });
  };
  const addTier = () => setTiers((prev) => [...prev, { id: uid(), label: "New" }]);
  const removeTier = (id) => setTiers((prev) => prev.filter((t) => t.id !== id));
  const renameTier = (id, label) => setTiers((prev) => prev.map((t) => t.id === id ? { ...t, label } : t));

  return (
    <Modal title={list ? "Edit List" : "New List"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={css.label}>Name</label>
          <input style={css.input} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="List name" />
        </div>
        <div>
          <label style={css.label}>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["numbered", "tiered", "unranked"].map((t) => (
              <button key={t} onClick={() => setType(t)}
                style={{ ...css.ghostBtn, color: type === t ? G.accent : G.textMuted, borderColor: type === t ? G.accent : G.border }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {type === "tiered" && (
          <div>
            <label style={css.label}>Tiers</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tiers.map((tier) => (
                <div key={tier.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, background: G.tierColors[tier.label] || G.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: "#fff", flexShrink: 0 }}>{tier.label.slice(0, 2)}</div>
                  <input style={{ ...css.input, width: 80 }} value={tier.label} onChange={(e) => renameTier(tier.id, e.target.value)} />
                  <button style={css.iconBtn(true)} onClick={() => removeTier(tier.id)}>✕</button>
                </div>
              ))}
              <button style={{ ...css.ghostBtn, alignSelf: "flex-start" }} onClick={addTier}>+ Add tier</button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
          <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={css.primaryBtn} onClick={submit}>Save List</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Catalogue/Tab Form Modal ─────────────────────────────────────────────────
function NameFormModal({ title, initial, onSave, onClose }) {
  const [name, setName] = useState(initial || "");
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={css.label}>Name</label>
          <input style={css.input} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())} autoFocus />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
          <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={css.primaryBtn} onClick={() => name.trim() && onSave(name.trim())}>Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirm" onClose={onClose}>
      <p style={{ color: G.textMuted, marginBottom: 20 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...css.primaryBtn, background: G.danger }} onClick={() => { onConfirm(); onClose(); }}>Delete</button>
      </div>
    </Modal>
  );
}

// ─── Draggable Item Card ──────────────────────────────────────────────────────
function ItemCard({ item, index, listType, tierLabel, rank, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver, onEdit, onDelete, onGallery }) {
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
      }}>
      <span style={{ color: G.textDim, fontSize: 11, minWidth: 20, textAlign: "right", flexShrink: 0 }}>
        {listType === "numbered" ? rank : "·"}
      </span>
      {item.thumbnail
        ? <img src={item.thumbnail} alt="" style={{ width: 36, height: 36, objectFit: "cover", flexShrink: 0, border: `1px solid ${G.border}` }} />
        : <div style={{ width: 36, height: 36, background: G.surfaceHigh, flexShrink: 0, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 10 }}>IMG</div>
      }
      <span style={{ flex: 1, fontSize: 14, letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {item.images?.length > 0 && (
          <button style={{ ...css.iconBtn(false), fontSize: 12 }} onClick={(e) => { e.stopPropagation(); onGallery(); }} title="View gallery">
            ⧉ {item.images.length}
          </button>
        )}
        <button style={css.iconBtn(false)} onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit">✎</button>
        <button style={css.iconBtn(true)} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">✕</button>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ list, items, onUpdate, onDelete, onItemCreate, onItemUpdate, onItemDelete }) {
  const [modal, setModal] = useState(null); // null | "editList" | "newItem" | {type:"editItem",item} | {type:"gallery",item} | {type:"confirm",msg,fn}
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const listItems = items.filter((it) => it.listId === list.id);

  // For tiered lists, items have a tierId; for others just ordered
  const [tierItems, setTierItems] = useState(() => {
    if (list.type !== "tiered") return {};
    const map = {};
    list.tiers.forEach((t) => { map[t.id] = listItems.filter((it) => it.tierId === t.id); });
    return map;
  });

  // Keep tierItems in sync when items change
  useEffect(() => {
    if (list.type !== "tiered") return;
    const map = {};
    list.tiers.forEach((t) => { map[t.id] = listItems.filter((it) => it.tierId === t.id); });
    setTierItems(map);
  }, [items, list]);

  // drag state for tiers
  const tierDrag = useRef({ tierId: null, idx: null });
  const tierOver = useRef({ tierId: null, idx: null });

  const handleDragStart = (idx) => { setDragIdx(idx); };
  const handleDragOver = (idx) => { setOverIdx(idx); };
  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const reordered = [...listItems];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    reordered.forEach((it, i) => onItemUpdate({ ...it, order: i }));
    setDragIdx(null); setOverIdx(null);
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
      {/* List header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${G.border}`, background: G.surfaceHigh }}>
        <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: G.accentDim, border: `1px solid ${G.accentDim}`, padding: "2px 7px" }}>
          {list.type}
        </span>
        <EditableText value={list.name} onSave={(n) => onUpdate({ ...list, name: n })}
          style={{ fontSize: 15, letterSpacing: "0.04em", flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          <button style={css.iconBtn(false)} onClick={() => setModal("editList")} title="Edit list">⚙</button>
          <button style={css.iconBtn(true)} onClick={() => setModal({ type: "confirm", msg: `Delete list "${list.name}" and all its items?`, fn: onDelete })} title="Delete list">✕</button>
        </div>
      </div>

      {/* Items */}
      {list.type === "tiered" ? (
        <div>
          {list.tiers.map((tier) => {
            const tItems = (tierItems[tier.id] || []);
            return (
              <div key={tier.id} style={{ display: "flex", borderBottom: `1px solid ${G.border}`, minHeight: 52 }}>
                <div style={{ width: 44, background: G.tierColors[tier.label] || G.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#fff", flexShrink: 0 }}>
                  {tier.label.slice(0, 2)}
                </div>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 0, padding: 4, alignContent: "flex-start", minHeight: 52 }}
                  onDragOver={(e) => { e.preventDefault(); tierOver.current = { tierId: tier.id, idx: tItems.length }; }}
                  onDrop={(e) => { e.preventDefault(); handleTierDrop(tier.id, tierOver.current.idx); }}>
                  {tItems.map((item, i) => (
                    <div key={item.id} draggable
                      onDragStart={() => { tierDrag.current = { tierId: tier.id, idx: i }; }}
                      onDragOver={(e) => { e.preventDefault(); tierOver.current = { tierId: tier.id, idx: i }; }}
                      onDrop={(e) => { e.preventDefault(); handleTierDrop(tier.id, i); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px", cursor: "grab", position: "relative" }}>
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" style={{ width: 48, height: 48, objectFit: "cover", border: `1px solid ${G.border}` }} />
                        : <div style={{ width: 48, height: 48, background: G.surfaceHigh, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: G.textDim, fontSize: 9 }}>IMG</div>
                      }
                      <span style={{ fontSize: 10, color: G.textMuted, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{item.name}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {item.images?.length > 0 && <button style={{ ...css.iconBtn(false), fontSize: 9, padding: "1px 3px" }} onClick={() => setModal({ type: "gallery", item })}>⧉</button>}
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
      ) : (
        <div>
          {sorted.map((item, i) => (
            <ItemCard key={item.id} item={item} index={i} listType={list.type} rank={i + 1}
              onDragStart={(e, idx) => handleDragStart(idx)}
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
            <div style={{ padding: "18px 16px", color: G.textDim, fontSize: 13, fontStyle: "italic" }}>No items yet.</div>
          )}
        </div>
      )}

      {/* Add item */}
      <div style={{ padding: "8px 12px", borderTop: sorted.length > 0 || list.type === "tiered" ? `1px solid ${G.border}` : "none" }}>
        <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={() => setModal("newItem")}>+ Add item</button>
      </div>

      {/* Modals */}
      {modal === "editList" && (
        <ListFormModal list={list} catalogueId={list.catalogueId}
          onSave={(updated) => { onUpdate(updated); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
      {modal === "newItem" && (
        <ItemFormModal listId={list.id}
          onSave={(item) => { onItemCreate({ ...item, tierId: list.type === "tiered" && list.tiers[0] ? list.tiers[list.tiers.length - 1].id : undefined, order: listItems.length }); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "editItem" && (
        <ItemFormModal item={modal.item} listId={list.id}
          onSave={(item) => { onItemUpdate(item); setModal(null); }}
          onClose={() => setModal(null)} />
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

// ─── Catalogue Panel ──────────────────────────────────────────────────────────
function CataloguePanel({ catalogue, lists, items, onUpdateCat, onDeleteCat, onCreateList, onUpdateList, onDeleteList, onItemCreate, onItemUpdate, onItemDelete }) {
  const [modal, setModal] = useState(null);
  const catLists = lists.filter((l) => l.catalogueId === catalogue.id);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ width: 3, height: 22, background: G.accent, flexShrink: 0 }} />
        <EditableText value={catalogue.name} onSave={(n) => onUpdateCat({ ...catalogue, name: n })}
          style={{ fontSize: 17, letterSpacing: "0.06em" }} />
        <span style={{ color: G.textDim, fontSize: 12 }}>({catLists.length} lists)</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button style={css.iconBtn(true)} onClick={() => setModal({ type: "confirm", msg: `Delete catalogue "${catalogue.name}"?`, fn: onDeleteCat })}>✕</button>
        </div>
      </div>
      {catLists.map((list) => (
        <ListView key={list.id} list={list} items={items}
          onUpdate={onUpdateList}
          onDelete={() => onDeleteList(list.id)}
          onItemCreate={onItemCreate}
          onItemUpdate={onItemUpdate}
          onItemDelete={onItemDelete}
        />
      ))}
      <button style={{ ...css.ghostBtn, fontSize: 11 }}
        onClick={() => setModal("newList")}>+ New list in {catalogue.name}</button>
      {modal === "newList" && (
        <ListFormModal catalogueId={catalogue.id}
          onSave={(list) => { onCreateList(list); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [modal, setModal] = useState(null);
  const saving = useRef(false);

  // Load from IndexedDB
  useEffect(() => {
    dbGet("appState").then((saved) => {
      if (saved) {
        setState(saved);
        setActiveTabId(saved.tabs[0]?.id || null);
      } else {
        const s = emptyState();
        setState(s);
        setActiveTabId(s.tabs[0].id);
      }
    }).catch(() => {
      const s = emptyState();
      setState(s);
      setActiveTabId(s.tabs[0].id);
    });
  }, []);

  // Persist on change
  useEffect(() => {
    if (!state || saving.current) return;
    saving.current = true;
    dbSet("appState", state).finally(() => { saving.current = false; });
  }, [state]);

  const update = useCallback((fn) => setState((prev) => fn(prev)), []);

  if (!state) return <div style={{ ...css.app, alignItems: "center", justifyContent: "center", fontSize: 13, color: G.textMuted }}>Loading…</div>;

  const activeTab = state.tabs.find((t) => t.id === activeTabId) || state.tabs[0];
  const tabCatalogues = state.catalogues.filter((c) => c.tabId === activeTabId);

  // CRUD handlers
  const createTab = (name) => {
    const tab = { id: uid(), name };
    update((s) => ({ ...s, tabs: [...s.tabs, tab] }));
    setActiveTabId(tab.id);
  };
  const updateTab = (tab) => update((s) => ({ ...s, tabs: s.tabs.map((t) => t.id === tab.id ? tab : t) }));
  const deleteTab = (id) => {
    const catIds = state.catalogues.filter((c) => c.tabId === id).map((c) => c.id);
    const listIds = state.lists.filter((l) => catIds.includes(l.catalogueId)).map((l) => l.id);
    update((s) => ({
      ...s,
      tabs: s.tabs.filter((t) => t.id !== id),
      catalogues: s.catalogues.filter((c) => c.tabId !== id),
      lists: s.lists.filter((l) => !listIds.includes(l.id)),
      items: s.items.filter((it) => !listIds.includes(it.listId)),
    }));
    if (activeTabId === id) setActiveTabId(state.tabs.find((t) => t.id !== id)?.id || null);
  };

  const createCatalogue = (name) => {
    const cat = { id: uid(), name, tabId: activeTabId };
    update((s) => ({ ...s, catalogues: [...s.catalogues, cat] }));
  };
  const updateCatalogue = (cat) => update((s) => ({ ...s, catalogues: s.catalogues.map((c) => c.id === cat.id ? cat : c) }));
  const deleteCatalogue = (id) => {
    const listIds = state.lists.filter((l) => l.catalogueId === id).map((l) => l.id);
    update((s) => ({
      ...s,
      catalogues: s.catalogues.filter((c) => c.id !== id),
      lists: s.lists.filter((l) => l.catalogueId !== id),
      items: s.items.filter((it) => !listIds.includes(it.listId)),
    }));
  };

  const createList = (list) => update((s) => ({ ...s, lists: [...s.lists, list] }));
  const updateList = (list) => update((s) => ({ ...s, lists: s.lists.map((l) => l.id === list.id ? list : l) }));
  const deleteList = (id) => update((s) => ({ ...s, lists: s.lists.filter((l) => l.id !== id), items: s.items.filter((it) => it.listId !== id) }));

  const createItem = (item) => update((s) => ({ ...s, items: [...s.items, item] }));
  const updateItem = (item) => update((s) => ({ ...s, items: s.items.map((it) => it.id === item.id ? item : it) }));
  const deleteItem = (id) => update((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));

  return (
    <div style={css.app}>
      {/* Top bar */}
      <div style={css.topBar}>
        <div style={{ display: "flex", alignItems: "center", paddingRight: 24, marginRight: 12, borderRight: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: G.accent }}>Catalogue</span>
        </div>
        {state.tabs.map((tab) => (
          <div key={tab.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <button style={css.tabBtn(tab.id === activeTabId)} onClick={() => setActiveTabId(tab.id)}>
              {tab.name}
            </button>
            {state.tabs.length > 1 && (
              <button style={{ ...css.iconBtn(true), fontSize: 10, padding: "0 4px", marginLeft: -4 }}
                onClick={() => setModal({ type: "confirm", msg: `Delete tab "${tab.name}"?`, fn: () => deleteTab(tab.id) })}>✕</button>
            )}
          </div>
        ))}
        <button style={{ ...css.tabBtn(false), color: G.textDim }} onClick={() => setModal("newTab")}>＋ Tab</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "28px 32px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {activeTab && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 28 }}>
              <EditableText value={activeTab.name} onSave={(n) => updateTab({ ...activeTab, name: n })}
                style={{ fontSize: 26, letterSpacing: "0.06em", fontWeight: "normal" }} />
              <button style={{ ...css.ghostBtn, fontSize: 11 }} onClick={() => setModal("newCatalogue")}>+ New catalogue</button>
            </div>

            {tabCatalogues.length === 0 && (
              <div style={{ color: G.textDim, fontStyle: "italic", fontSize: 13 }}>
                No catalogues yet. Create one to start organizing your lists.
              </div>
            )}

            {tabCatalogues.map((cat) => (
              <CataloguePanel key={cat.id} catalogue={cat}
                lists={state.lists} items={state.items}
                onUpdateCat={updateCatalogue}
                onDeleteCat={() => deleteCatalogue(cat.id)}
                onCreateList={createList}
                onUpdateList={updateList}
                onDeleteList={deleteList}
                onItemCreate={createItem}
                onItemUpdate={updateItem}
                onItemDelete={deleteItem}
              />
            ))}
          </>
        )}
      </div>

      {/* Global modals */}
      {modal === "newTab" && (
        <NameFormModal title="New Tab" onSave={(n) => { createTab(n); setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal === "newCatalogue" && (
        <NameFormModal title="New Catalogue" onSave={(n) => { createCatalogue(n); setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
