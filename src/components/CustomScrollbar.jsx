import { useRef, useState, useEffect, useCallback } from "react";
import { G } from "../styles";

const SCROLLBAR_WIDTH = 10;
const TRACK_PADDING = 3;

export default function CustomScrollbar({ children, style = {}, className }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const thumbRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const dragStart = useRef(null);

  // Compute visibility from viewport
  const computeVisibility = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight + 1;
    setVisible(hasScroll);
  }, []);

  // Position the thumb directly on the DOM
  const positionThumb = useCallback(() => {
    const el = viewportRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;

    const { scrollHeight, clientHeight, scrollTop } = el;
    const trackH = clientHeight - TRACK_PADDING * 2;
    const ratio = clientHeight / scrollHeight;
    const tHeight = Math.max(32, trackH * ratio);
    const tTop = TRACK_PADDING + (scrollTop / (scrollHeight - clientHeight)) * (trackH - tHeight);

    thumb.style.height = `${tHeight}px`;
    thumb.style.top = `${tTop}px`;
  }, []);

  // Debounced updater for ResizeObserver to break re-render feedback loop
  const roTimer = useRef(null);
  const debouncedUpdate = useCallback(() => {
    clearTimeout(roTimer.current);
    roTimer.current = setTimeout(() => {
      computeVisibility();
      positionThumb();
    }, 16);
  }, [computeVisibility, positionThumb]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => positionThumb();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(el);
    if (contentRef.current) ro.observe(contentRef.current);
    computeVisibility();
    positionThumb();
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      clearTimeout(roTimer.current);
    };
  }, [computeVisibility, positionThumb, debouncedUpdate]);

  useEffect(() => {
    if (visible) positionThumb();
  }, [visible, positionThumb]);

  // Flash on scroll
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef(null);
  const onScroll = () => {
    positionThumb();
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 1200);
  };

  // Drag logic
  const onThumbMouseDown = (e) => {
    e.preventDefault();
    dragStart.current = { mouseY: e.clientY, scrollTop: viewportRef.current.scrollTop };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const el = viewportRef.current;
      const thumb = thumbRef.current;
      if (!el || !dragStart.current || !thumb) return;
      const dy = e.clientY - dragStart.current.mouseY;
      const { scrollHeight, clientHeight } = el;
      const trackH = clientHeight - TRACK_PADDING * 2;
      const tHeight = parseFloat(thumb.style.height) || Math.max(32, (clientHeight / scrollHeight) * trackH);
      const scrollRatio = dy / (trackH - tHeight);
      el.scrollTop = dragStart.current.scrollTop + scrollRatio * (scrollHeight - clientHeight);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  // Click on track to jump
  const onTrackClick = (e) => {
    if (e.target === thumbRef.current) return;
    const el = viewportRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tHeight = parseFloat(thumb.style.height) || 32;
    const clickY = e.clientY - rect.top - tHeight / 2;
    const trackH = el.clientHeight - TRACK_PADDING * 2;
    const ratio = Math.max(0, Math.min(1, clickY / (trackH - tHeight)));
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  const thumbVisible = visible && (hovered || dragging || flash);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", ...style }}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={viewportRef}
        onScroll={onScroll}
        style={{
          width: `calc(100% + ${SCROLLBAR_WIDTH + 4}px)`,
          height: "100%",
          overflowY: "scroll",
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div ref={contentRef} style={{ width: `calc(100% - ${SCROLLBAR_WIDTH + 4}px)` }}>
          {children}
        </div>
      </div>

      {visible && (
        <div
          onClick={onTrackClick}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: SCROLLBAR_WIDTH,
            height: "100%",
            background: "transparent",
            zIndex: 10,
          }}
        >
          <div
            ref={thumbRef}
            onMouseDown={onThumbMouseDown}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "100%",
              height: 32,
              background: dragging ? G.accent : hovered ? G.accentDim : G.border,
              borderRadius: 0,
              opacity: thumbVisible ? 1 : 0,
              transition: dragging ? "none" : "opacity 0.3s, background 0.2s",
            }}
          />
        </div>
      )}

      <style>{`
        [data-custom-scroll]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}