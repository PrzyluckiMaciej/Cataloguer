import { useState, useEffect, useRef } from "react";
import { G } from "../styles";
import Modal from "./Modal";

export default function GalleryModal({ item, onClose }) {
  const [idx, setIdx] = useState(0);
  const images = item.images || [];
  
  // Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") {
        resetZoom();
        setIdx((i) => (i + 1) % images.length);
      }
      if (e.key === "ArrowLeft") {
        resetZoom();
        setIdx((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "Escape") {
        if (scale > 1) {
          resetZoom();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, scale, onClose]);

  // Reset zoom when changing images
  useEffect(() => {
    resetZoom();
  }, [idx]);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(4, Math.max(1, scale * delta));
    
    if (newScale !== scale) {
      // Calculate zoom center based on mouse position
      const rect = imageContainerRef.current?.getBoundingClientRect();
      if (rect && newScale > 1) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imageRect = imageRef.current?.getBoundingClientRect();
        if (imageRect) {
          const dx = mouseX - (rect.width / 2);
          const dy = mouseY - (rect.height / 2);
          setPosition(prev => ({
            x: prev.x - dx * (newScale - scale) / scale,
            y: prev.y - dy * (newScale - scale) / scale,
          }));
        }
      }
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain drag bounds
      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      if (containerRect && imageRect) {
        const maxX = Math.max(0, (imageRect.width * scale - containerRect.width) / 2);
        const maxY = Math.max(0, (imageRect.height * scale - containerRect.height) / 2);
        setPosition({
          x: Math.min(maxX, Math.max(-maxX, newX)),
          y: Math.min(maxY, Math.max(-maxY, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double-click to reset zoom
  const handleDoubleClick = () => {
    resetZoom();
  };

  if (!images.length) {
    return (
      <Modal title={item.name} onClose={onClose}>
        <p style={{ color: G.textMuted, fontStyle: "italic" }}>No images attached.</p>
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
          {scale > 1 && (
            <button
              onClick={resetZoom}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: G.textMuted,
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 4,
              }}
              title="Reset zoom"
            >
              Reset zoom ({Math.round(scale * 100)}%)
            </button>
          )}
          <span style={{ fontSize: 12, color: G.textMuted, letterSpacing: "0.08em" }}>
            {idx + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          >✕</button>
        </div>
      </div>

      {/* Main image area with zoom/drag */}
      <div 
        ref={imageContainerRef}
        style={{ 
          flex: 1, 
          position: "relative", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          overflow: "hidden",
          minHeight: 0,
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <img
          ref={imageRef}
          key={idx}
          src={images[idx]}
          alt=""
          draggable={false}
          style={{
            maxWidth: scale === 1 ? "100%" : "none",
            maxHeight: scale === 1 ? "100%" : "none",
            width: scale > 1 ? "auto" : "auto",
            height: scale > 1 ? "auto" : "auto",
            objectFit: "contain",
            display: "block",
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
            pointerEvents: scale > 1 ? "auto" : "none",
          }}
        />
        
        {/* Zoom hint */}
        {scale === 1 && (
          <div style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            background: "rgba(0,0,0,0.6)",
            color: G.textMuted,
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 10,
          }}>
            Scroll to zoom
          </div>
        )}
        
        {scale > 1 && (
          <div style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            background: "rgba(0,0,0,0.6)",
            color: G.textMuted,
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 10,
          }}>
            Drag to pan • Double-click to reset
          </div>
        )}
      </div>

      {/* Navigation buttons - hide when zoomed to avoid accidental clicks */}
      {images.length > 1 && scale === 1 && (
        <>
          <button
            onClick={() => {
              resetZoom();
              setIdx((i) => (i - 1 + images.length) % images.length);
            }}
            style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 60,
              background: "transparent", border: "none", color: G.text,
              cursor: "pointer", fontSize: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s", zIndex: 5,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >‹</button>
          <button
            onClick={() => {
              resetZoom();
              setIdx((i) => (i + 1) % images.length);
            }}
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
              background: "transparent", border: "none", color: G.text,
              cursor: "pointer", fontSize: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s", zIndex: 5,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >›</button>
        </>
      )}

      {/* Filmstrip */}
      {images.length > 1 && (
        <div style={{
          flexShrink: 0,
          display: "flex", gap: 6, padding: "10px 16px",
          overflowX: "auto", justifyContent: "center",
          borderTop: `1px solid ${G.border}`,
          background: "rgba(0,0,0,0.8)",
        }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              onClick={() => {
                resetZoom();
                setIdx(i);
              }}
              style={{
                width: 60, height: 60, objectFit: "cover",
                cursor: "pointer", flexShrink: 0,
                border: i === idx ? `2px solid ${G.accent}` : `2px solid transparent`,
                opacity: i === idx ? 1 : 0.45,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}