import { useState, useRef } from "react";
import { G, css } from "../styles";
import { uid, fileToBase64 } from "../helpers";
import Modal from "./Modal";

export default function ItemFormModal({ item, listId, onSave, onClose }) {
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
          <input
            style={css.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
            placeholder="Item name"
          />
        </div>

        <div>
          <label style={css.label}>Thumbnail</label>
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              style={{ width: 80, height: 80, objectFit: "cover", display: "block", marginBottom: 8, border: `1px solid ${G.border}` }}
            />
          )}
          <button style={css.ghostBtn} onClick={() => thumbRef.current.click()}>
            {thumbnail ? "Replace" : "Upload thumbnail"}
          </button>
          {thumbnail && (
            <button style={{ ...css.ghostBtn, marginLeft: 8 }} onClick={() => setThumbnail(null)}>
              Remove
            </button>
          )}
          <input ref={thumbRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} />
        </div>

        <div>
          <label style={css.label}>Images ({images.length})</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {images.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt=""
                  style={{ width: 60, height: 60, objectFit: "cover", border: `1px solid ${G.border}` }}
                />
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: "absolute", top: 0, right: 0,
                    background: "rgba(0,0,0,0.8)", color: G.text,
                    border: "none", width: 18, height: 18,
                    cursor: "pointer", fontSize: 10, padding: 0,
                  }}
                >✕</button>
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
