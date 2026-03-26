import { useState, useRef, useEffect, useCallback } from "react";
import { G, css } from "../styles";
import { uid, fileToBase64 } from "../helpers";
import Modal from "./Modal";
import ThumbnailCropper from "./ThumbnailCropper";
import { parseVideoUrl, PlatformIcon } from "./VideoEmbed";

export function normalizeVideo(v) {
  if (typeof v === "string") return { kind: "url", src: v };
  return v;
}

const MAX_FILE_MB = 50;

export default function ItemFormModal({ item, listId, listItems = [], onSave, onClose }) {
  const [name, setName]           = useState(item?.name || "");
  const [thumbnail, setThumbnail] = useState(item?.thumbnail || null);
  const [images, setImages]       = useState(item?.images || []);
  const [videos, setVideos]       = useState(() => (item?.videos || []).map(normalizeVideo));
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState("");
  const [cropSrc, setCropSrc]     = useState(null);

  const currentPos    = item != null ? (item.order ?? 0) + 1 : null;
  const [positionStr, setPositionStr] = useState(String(currentPos ?? ""));
  const initialPosRef = useRef(currentPos);

  const thumbRef  = useRef();
  const imgsRef   = useRef();
  const videosRef = useRef();

  const handleThumb = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const src = await fileToBase64(f);
    setCropSrc(src);
    e.target.value = "";
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    const b64s  = await Promise.all(files.map(fileToBase64));
    setImages((prev) => [...prev, ...b64s]);
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, j) => j !== i));

  const addVideoUrl = () => {
    const url = videoInput.trim();
    if (!url) return;
    if (!parseVideoUrl(url)) {
      setVideoError("Couldn't recognise this URL. Supported: YouTube, Instagram, Facebook.");
      return;
    }
    if (videos.some((v) => v.src === url)) {
      setVideoError("This video has already been added.");
      return;
    }
    setVideos((prev) => [...prev, { kind: "url", src: url }]);
    setVideoInput("");
    setVideoError("");
  };

  const handleVideoKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addVideoUrl(); }
  };

  const handleVideoFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    const oversized = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      setVideoError(`${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the ${MAX_FILE_MB} MB limit and were skipped.`);
    }
    const ok = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    const entries = await Promise.all(
      ok.map(async (f) => ({ kind: "upload", src: await fileToBase64(f), name: f.name }))
    );
    if (entries.length) setVideos((prev) => [...prev, ...entries]);
  };

  const removeVideo = (i) => setVideos((prev) => prev.filter((_, j) => j !== i));

  const submit = useCallback(() => {
    if (!name.trim()) return;
    const saved = {
      id: item?.id || uid(),
      name: name.trim(),
      thumbnail,
      images,
      videos,
      listId,
      order: item?.order,
    };

    if (item && listItems.length > 0) {
      const parsed  = parseInt(positionStr, 10);
      const clamped = isNaN(parsed) ? initialPosRef.current : Math.max(1, Math.min(parsed, listItems.length));
      if (clamped !== initialPosRef.current) {
        const reordered = listItems.filter((it) => it.id !== item.id);
        reordered.splice(clamped - 1, 0, { ...saved });
        onSave(saved, reordered.map((it, i) => ({ ...it, order: i })));
      } else {
        onSave(saved, null);
      }
    } else {
      onSave(saved, null);
    }
  }, [name, thumbnail, images, videos, positionStr, item, listItems, listId, onSave]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = document.activeElement?.tagName;
        if (tag === "BUTTON" || (tag === "INPUT" && document.activeElement.type === "file")) return;
        if (document.activeElement?.dataset?.videoinput) return;
        submit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit]);

  return (
    <>
      <Modal title={item ? "Edit Item" : "New Item"} onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name */}
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

          {/* Position */}
          {item && listItems.length > 1 && (
            <div>
              <label style={css.label}>Position (1 – {listItems.length})</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number" min={1} max={listItems.length}
                  style={{ ...css.input, width: 72 }}
                  value={positionStr}
                  onChange={(e) => setPositionStr(e.target.value)}
                  onBlur={() => {
                    const parsed  = parseInt(positionStr, 10);
                    const clamped = isNaN(parsed) ? initialPosRef.current : Math.max(1, Math.min(parsed, listItems.length));
                    setPositionStr(String(clamped));
                  }}
                />
                <span style={{ fontSize: 12, color: G.textDim }}>of {listItems.length}</span>
              </div>
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <label style={css.label}>Thumbnail</label>
            {thumbnail && (
              <img src={thumbnail} alt="" style={{ width: 80, height: 80, objectFit: "cover", display: "block", marginBottom: 8, border: `1px solid ${G.border}` }} />
            )}
            <button style={css.ghostBtn} onClick={() => thumbRef.current.click()}>
              {thumbnail ? "Replace" : "Upload thumbnail"}
            </button>
            {thumbnail && (
              <>
                <button style={{ ...css.ghostBtn, marginLeft: 8 }} onClick={() => setCropSrc(thumbnail)}>Crop</button>
                <button style={{ ...css.ghostBtn, marginLeft: 8 }} onClick={() => setThumbnail(null)}>Remove</button>
              </>
            )}
            <input ref={thumbRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} />
          </div>

          {/* Images */}
          <div>
            <label style={css.label}>Images ({images.length})</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={src} alt="" style={{ width: 60, height: 60, objectFit: "cover", border: `1px solid ${G.border}` }} />
                  <button
                    onClick={() => removeImage(i)}
                    style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.8)", color: G.text, border: "none", width: 18, height: 18, cursor: "pointer", fontSize: 10, padding: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>
            <button style={css.ghostBtn} onClick={() => imgsRef.current.click()}>Add images</button>
            <input ref={imgsRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImages} />
          </div>

          {/* Videos */}
          <div>
            <label style={css.label}>Videos ({videos.length})</label>

            {/* Existing video list */}
            {videos.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {videos.map((v, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: G.surfaceHigh, border: `1px solid ${G.border}`,
                    padding: "6px 10px",
                  }}>
                    {v.kind === "upload" ? (
                      <span style={{ fontSize: 13, color: G.textDim, lineHeight: 1 }}>▶</span>
                    ) : (
                      <PlatformIcon platform={parseVideoUrl(v.src)?.platform || "unknown"} size={14} />
                    )}
                    <span style={{ flex: 1, fontSize: 12, color: G.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.kind === "upload" ? (v.name || "Uploaded video") : v.src}
                    </span>
                    <span style={{ fontSize: 10, color: G.textDim, flexShrink: 0, letterSpacing: "0.06em" }}>
                      {v.kind === "upload" ? "FILE" : "URL"}
                    </span>
                    <button
                      onClick={() => removeVideo(i)}
                      style={{ background: "none", border: "none", color: G.danger, cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                data-videoinput="1"
                style={{ ...css.input, flex: 1, fontSize: 12 }}
                value={videoInput}
                onChange={(e) => { setVideoInput(e.target.value); setVideoError(""); }}
                onKeyDown={handleVideoKeyDown}
                placeholder="Paste YouTube, Instagram or Facebook URL"
              />
              <button style={css.ghostBtn} onClick={addVideoUrl}>Add</button>
            </div>

            {/* File upload button */}
            <div style={{ marginTop: 8 }}>
              <button style={css.ghostBtn} onClick={() => videosRef.current.click()}>
                Upload video file
              </button>
              <span style={{ marginLeft: 8, fontSize: 11, color: G.textDim }}>MP4, WebM, MOV · max {MAX_FILE_MB} MB each</span>
            </div>
            <input
              ref={videosRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              multiple
              style={{ display: "none" }}
              onChange={handleVideoFiles}
            />

            {videoError && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: G.danger }}>{videoError}</p>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
            <button style={css.ghostBtn} onClick={onClose}>Cancel</button>
            <button style={css.primaryBtn} onClick={submit}>Save Item</button>
          </div>

        </div>
      </Modal>

      {cropSrc && (
        <ThumbnailCropper
          imageSrc={cropSrc}
          onCrop={(cropped) => { setThumbnail(cropped); setCropSrc(null); }}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}