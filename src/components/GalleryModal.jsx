import { useState, useEffect, useRef } from "react";
import { G } from "../styles";
import Modal from "./Modal";
import VideoEmbed, { parseVideoUrl, PlatformIcon } from "./VideoEmbed";
import { useBlobUrl } from "../useAppState";

function normalizeVideo(v) {
  if (typeof v === "string") return { kind: "url", src: v };
  return v;
}

function buildMediaList(item) {
  const list = [];
  (item.images || []).forEach((src) => list.push({ type: "image", src }));
  (item.videos || []).map(normalizeVideo).forEach((v) => list.push({ type: "video", ...v }));
  return list;
}

// Filmstrip thumbnail
function StripThumb({ m, isActive, onClick }) {
  const { url } = useBlobUrl(m.type === "image" ? m.src : (m.kind === "upload" ? m.src : null));
  const vParsed = m.type === "video" && m.kind !== "upload" ? parseVideoUrl(m.src) : null;

  return (
    <div
      onClick={onClick}
      style={{
        width: 60, height: 60, flexShrink: 0,
        cursor: "pointer",
        border: isActive ? `2px solid ${G.accent}` : `2px solid transparent`,
        opacity: isActive ? 1 : 0.45,
        transition: "opacity 0.15s, border-color 0.15s",
        overflow: "hidden",
        background: G.surfaceHigh,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {m.type === "image" ? (
        url ? <img src={url} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null
      ) : m.kind === "upload" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 18, color: G.textMuted, lineHeight: 1 }}>▶</span>
          <span style={{ fontSize: 9, color: G.textDim }}>FILE</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <PlatformIcon platform={vParsed?.platform || "unknown"} size={18} />
          <span style={{ fontSize: 9, color: G.textDim, textTransform: "capitalize" }}>{vParsed?.platform || "video"}</span>
        </div>
      )}
    </div>
  );
}

function FilmStrip({ media, idx, onSelect }) {
  const stripRef   = useRef(null);
  const activeRef  = useRef(null);
  const dragOrigin = useRef(null);
  const didDrag    = useRef(false);

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = activeRef.current;
    if (!strip || !thumb) return;
    const stripRect = strip.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const scrollLeft = strip.scrollLeft + thumbRect.left - stripRect.left
      - stripRect.width / 2 + thumbRect.width / 2;
    strip.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [idx]);

  const onStripMouseDown = (e) => {
    e.preventDefault();
    const strip = stripRef.current;
    if (!strip) return;
    dragOrigin.current = { x: e.clientX, scrollLeft: strip.scrollLeft };
    didDrag.current = false;
  };

  const onStripMouseMove = (e) => {
    if (!dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    if (Math.abs(dx) > 4) {
      didDrag.current = true;
      stripRef.current.scrollLeft = dragOrigin.current.scrollLeft - dx;
    }
  };

  const onStripMouseUp = () => { dragOrigin.current = null; };

  return (
    <div
      ref={stripRef}
      onMouseDown={onStripMouseDown}
      onMouseMove={onStripMouseMove}
      onMouseUp={onStripMouseUp}
      onMouseLeave={onStripMouseUp}
      style={{
        flexShrink: 0,
        display: "flex", gap: 6, padding: "10px 16px",
        overflowX: "auto",
        borderTop: `1px solid ${G.border}`,
        background: "rgba(0,0,0,0.8)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      {media.map((m, i) => (
        <div key={i} ref={i === idx ? activeRef : null}>
          <StripThumb
            m={m}
            isActive={i === idx}
            onClick={() => { if (!didDrag.current) onSelect(i); }}
          />
        </div>
      ))}
    </div>
  );
}

// Main image viewer
function BlobImg({ src, scale, position, isDragging, onRef }) {
  const { url } = useBlobUrl(src);
  if (!url) return null;
  return (
    <img
      ref={onRef}
      src={url}
      alt=""
      draggable={false}
      style={{
        maxWidth:  scale === 1 ? "100%" : "none",
        maxHeight: scale === 1 ? "100%" : "none",
        objectFit: "contain",
        display: "block",
        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
        transition: isDragging ? "none" : "transform 0.1s ease-out",
        pointerEvents: scale > 1 ? "auto" : "none",
      }}
    />
  );
}

function BlobVideo({ src, name }) {
  const { url } = useBlobUrl(src);
  if (!url) return null;
  return (
    <video
      src={url}
      controls
      style={{
        maxWidth: "min(900px, 92vw)",
        maxHeight: "80vh",
        display: "block",
        background: "#000",
      }}
    />
  );
}

// GalleryModal
export default function GalleryModal({ item, onClose }) {
  const media = buildMediaList(item);

  const [idx, setIdx]           = useState(0);
  const [scale, setScale]       = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 });

  const imageContainerRef = useRef(null);
  const imageRef          = useRef(null);

  const current  = media[idx] || null;
  const isVideo  = current?.type === "video";
  const isUpload = isVideo && current?.kind === "upload";
  const parsed   = isVideo && !isUpload ? parseVideoUrl(current.src) : null;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") { resetZoom(); setIdx((i) => (i + 1) % media.length); }
      if (e.key === "ArrowLeft")  { resetZoom(); setIdx((i) => (i - 1 + media.length) % media.length); }
      if (e.key === "Escape") {
        if (scale > 1) resetZoom();
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [media.length, scale, onClose]);

  useEffect(() => { resetZoom(); }, [idx]);

  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleWheel = (e) => {
    if (current?.type !== "image") return;
    e.preventDefault();
    const delta    = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(4, Math.max(1, scale * delta));
    if (newScale !== scale) {
      const rect = imageContainerRef.current?.getBoundingClientRect();
      if (rect && newScale > 1) {
        const dx = e.clientX - rect.left - rect.width / 2;
        const dy = e.clientY - rect.top  - rect.height / 2;
        setPosition((prev) => ({
          x: prev.x - dx * (newScale - scale) / scale,
          y: prev.y - dy * (newScale - scale) / scale,
        }));
      }
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      const imageRect     = imageRef.current?.getBoundingClientRect();
      if (containerRect && imageRect) {
        const maxX = Math.max(0, (imageRect.width  * scale - containerRect.width)  / 2);
        const maxY = Math.max(0, (imageRect.height * scale - containerRect.height) / 2);
        setPosition({ x: Math.min(maxX, Math.max(-maxX, newX)), y: Math.min(maxY, Math.max(-maxY, newY)) });
      } else {
        setPosition({ x: newX, y: newY });
      }
    }
  };

  if (!media.length) {
    return (
      <Modal title={item.name} onClose={onClose}>
        <p style={{ color: G.textMuted, fontStyle: "italic" }}>No media attached.</p>
      </Modal>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
      }}
      onClick={(e) => e.target === e.currentTarget && scale === 1 && onClose()}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: `1px solid ${G.border}`,
        flexShrink: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 10,
      }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, letterSpacing: "0.05em", color: G.text }}>
          {item.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isUpload && (
            <span style={{ fontSize: 12, color: G.textDim }}>{current.name || "Uploaded video"}</span>
          )}
          {isVideo && !isUpload && parsed && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: G.textDim }}>
              <PlatformIcon platform={parsed.platform} size={13} />
              <span style={{ textTransform: "capitalize" }}>{parsed.platform}</span>
            </span>
          )}
          {!isVideo && scale > 1 && (
            <button
              onClick={resetZoom}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 12, padding: "4px 8px", borderRadius: 4 }}
            >
              Reset zoom ({Math.round(scale * 100)}%)
            </button>
          )}
          <span style={{ fontSize: 12, color: G.textMuted, letterSpacing: "0.08em" }}>
            {idx + 1} / {media.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          >✕</button>
        </div>
      </div>

      {/* Main content */}
      <div
        ref={imageContainerRef}
        style={{
          flex: 1, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", minHeight: 0,
          cursor: (!isVideo && scale > 1) ? (isDragging ? "grabbing" : "grab") : "default",
        }}
        onWheel={!isVideo ? handleWheel : undefined}
        onMouseDown={!isVideo ? handleMouseDown : undefined}
        onMouseMove={!isVideo ? handleMouseMove : undefined}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onDoubleClick={!isVideo ? resetZoom : undefined}
      >
        {isUpload ? (
          <BlobVideo src={current.src} name={current.name} />
        ) : isVideo ? (
          <div style={{ width: "min(860px, 92vw)" }}>
            <VideoEmbed url={current.src} aspectRatio="16/9" />
          </div>
        ) : (
          <>
            <BlobImg
              src={current.src}
              scale={scale}
              position={position}
              isDragging={isDragging}
              onRef={(el) => { imageRef.current = el; }}
            />
            {scale === 1 && (
              <div style={{ position: "absolute", bottom: 20, right: 20, background: "rgba(0,0,0,0.6)", color: G.textMuted, fontSize: 11, padding: "4px 8px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
                Scroll to zoom
              </div>
            )}
            {scale > 1 && (
              <div style={{ position: "absolute", bottom: 20, right: 20, background: "rgba(0,0,0,0.6)", color: G.textMuted, fontSize: 11, padding: "4px 8px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
                Drag to pan · Double-click to reset
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav arrows */}
      {media.length > 1 && scale === 1 && (
        <>
          <button
            onClick={() => { resetZoom(); setIdx((i) => (i - 1 + media.length) % media.length); }}
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "transparent", border: "none", color: G.text, cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", zIndex: 5 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >‹</button>
          <button
            onClick={() => { resetZoom(); setIdx((i) => (i + 1) % media.length); }}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "transparent", border: "none", color: G.text, cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", zIndex: 5 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >›</button>
        </>
      )}

      {/* Filmstrip */}
      {media.length > 1 && (
        <FilmStrip media={media} idx={idx} onSelect={(i) => { resetZoom(); setIdx(i); }} />
      )}
    </div>
  );
}