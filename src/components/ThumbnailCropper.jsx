import { useState, useRef, useEffect, useCallback } from "react";
import { G, css } from "../styles";
import Modal from "./Modal";

const MIN_SIZE = 40;
const HANDLE_HIT = 20;   // invisible hit area size
const HANDLE_VIS = 10;   // visible dot size

export default function ThumbnailCropper({ imageSrc, onCrop, onCancel }) {
  const containerRef = useRef();
  const imgRef = useRef();
  const canvasRef = useRef();

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState(null);
  const cropRef = useRef(null);

  const dragState = useRef(null);

  const updateCrop = (next) => {
    cropRef.current = next;
    setCrop(next);
  };

  const handleImgLoad = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const maxW = container.clientWidth;
    const maxH = 420;
    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
    const dw = Math.round(naturalW * scale);
    const dh = Math.round(naturalH * scale);

    setImgSize({ w: naturalW, h: naturalH });
    setDisplaySize({ w: dw, h: dh });

    const side = Math.min(dw, dh);
    const initial = {
      x: Math.round((dw - side) / 2),
      y: Math.round((dh - side) / 2),
      size: side,
    };
    updateCrop(initial);
  }, []);

  const clampCrop = (c, dw, dh) => {
    const size = Math.max(MIN_SIZE, Math.min(c.size, dw, dh));
    const x = Math.max(0, Math.min(c.x, dw - size));
    const y = Math.max(0, Math.min(c.y, dh - size));
    return { x, y, size };
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const c = cropRef.current;
    if (!c) return;
    const rect = imgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const r = HANDLE_HIT / 2;
    const corners = [
      { id: "tl", cx: c.x,          cy: c.y },
      { id: "tr", cx: c.x + c.size, cy: c.y },
      { id: "bl", cx: c.x,          cy: c.y + c.size },
      { id: "br", cx: c.x + c.size, cy: c.y + c.size },
    ];
    for (const corner of corners) {
      if (Math.abs(mx - corner.cx) <= r && Math.abs(my - corner.cy) <= r) {
        dragState.current = { type: "resize", corner: corner.id, startX: mx, startY: my, startCrop: { ...c } };
        return;
      }
    }

    if (mx >= c.x && mx <= c.x + c.size && my >= c.y && my <= c.y + c.size) {
      dragState.current = { type: "move", startX: mx, startY: my, startCrop: { ...c } };
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - ds.startX;
      const dy = my - ds.startY;
      const sc = ds.startCrop;
      const dw = rect.width;
      const dh = rect.height;

      if (ds.type === "move") {
        updateCrop(clampCrop({ x: sc.x + dx, y: sc.y + dy, size: sc.size }, dw, dh));
        return;
      }

      let x = sc.x, y = sc.y, size = sc.size;

      if (ds.corner === "br") {
        // anchor: top-left — grow right and down
        size = Math.max(MIN_SIZE, Math.min(sc.size + dx, sc.size + dy, dw - sc.x, dh - sc.y));
      } else if (ds.corner === "bl") {
        // anchor: top-right — grow left and down
        const maxGrow = Math.min(sc.x, dh - sc.y - sc.size);
        const d = Math.max(-maxGrow, Math.min(-dx, dy, sc.size - MIN_SIZE));
        size = sc.size + d;
        x = sc.x - d;
      } else if (ds.corner === "tr") {
        // anchor: bottom-left — grow right and up
        const maxGrow = Math.min(sc.y, dw - sc.x - sc.size);
        const d = Math.max(-maxGrow, Math.min(dx, -dy, sc.size - MIN_SIZE));
        size = sc.size + d;
        y = sc.y - d;
      } else if (ds.corner === "tl") {
        // anchor: bottom-right — grow left and up
        const maxGrow = Math.min(sc.x, sc.y);
        const d = Math.max(-maxGrow, Math.min(-dx, -dy, sc.size - MIN_SIZE));
        size = sc.size + d;
        x = sc.x - d;
        y = sc.y - d;
      }

      updateCrop(clampCrop({ x, y, size }, dw, dh));
    };

    const onMouseUp = () => { dragState.current = null; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleCrop = () => {
    if (!crop || !imgRef.current) return;
    const scale = imgSize.w / displaySize.w;
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 400;
    canvas.getContext("2d").drawImage(
      imgRef.current,
      crop.x * scale, crop.y * scale,
      crop.size * scale, crop.size * scale,
      0, 0, 400, 400
    );
    onCrop(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handles = crop ? [
    { id: "tl", x: crop.x,             y: crop.y,             cursor: "nw-resize" },
    { id: "tr", x: crop.x + crop.size,  y: crop.y,             cursor: "ne-resize" },
    { id: "bl", x: crop.x,             y: crop.y + crop.size,  cursor: "sw-resize" },
    { id: "br", x: crop.x + crop.size,  y: crop.y + crop.size, cursor: "se-resize" },
  ] : [];

  return (
    <Modal title="Crop Thumbnail" onClose={onCancel}>
      <div ref={containerRef} style={{ width: "100%" }}>

        {/* Centered image + overlay */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div
            style={{
              position: "relative",
              width: displaySize.w || "auto",
              cursor: "crosshair",
              userSelect: "none",
              lineHeight: 0,
            }}
            onMouseDown={onMouseDown}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              onLoad={handleImgLoad}
              draggable={false}
              style={{ display: "block", width: displaySize.w || "auto", height: displaySize.h || "auto" }}
            />

            {crop && (
              <>
                {/* Darkened mask */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.6)" }} />
                  <div style={{ position: "absolute", top: crop.y + crop.size, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)" }} />
                  <div style={{ position: "absolute", top: crop.y, left: 0, width: crop.x, height: crop.size, background: "rgba(0,0,0,0.6)" }} />
                  <div style={{ position: "absolute", top: crop.y, left: crop.x + crop.size, right: 0, height: crop.size, background: "rgba(0,0,0,0.6)" }} />
                </div>

                {/* Crop border + rule-of-thirds */}
                <div style={{
                  position: "absolute",
                  left: crop.x, top: crop.y,
                  width: crop.size, height: crop.size,
                  border: `2px solid ${G.accent}`,
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}>
                  {[1, 2].map((n) => (
                    <div key={`v${n}`} style={{ position: "absolute", left: `${(n / 3) * 100}%`, top: 0, width: 1, height: "100%", background: "rgba(232,213,163,0.25)" }} />
                  ))}
                  {[1, 2].map((n) => (
                    <div key={`h${n}`} style={{ position: "absolute", top: `${(n / 3) * 100}%`, left: 0, height: 1, width: "100%", background: "rgba(232,213,163,0.25)" }} />
                  ))}
                </div>

                {/* Handles — large hit area, round visible dot */}
                {handles.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      position: "absolute",
                      left: h.x - HANDLE_HIT / 2,
                      top: h.y - HANDLE_HIT / 2,
                      width: HANDLE_HIT,
                      height: HANDLE_HIT,
                      cursor: h.cursor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{
                      width: HANDLE_VIS,
                      height: HANDLE_VIS,
                      background: G.accent,
                      border: `2px solid ${G.bg}`,
                      borderRadius: "50%",
                      boxShadow: "0 0 4px rgba(0,0,0,0.7)",
                      pointerEvents: "none",
                    }} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
          <button style={css.ghostBtn} onClick={onCancel}>Cancel</button>
          <button style={css.primaryBtn} onClick={handleCrop}>Apply crop</button>
        </div>
      </div>
    </Modal>
  );
}