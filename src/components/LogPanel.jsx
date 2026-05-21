import React, { useState, useRef, useEffect } from 'react';

// WC3-style log: a skinny strip pinned to the bottom of its container that
// auto-scrolls to the newest message. Drag the top edge upward to expand
// for history; drag back down to collapse. Old messages fade out near the
// top so the "stream of recent events" feel reads even at default height.
const MIN_H = 56;
const MAX_H = 480;
const DEFAULT_H = 80;

export function LogPanel({ log }) {
  const [height, setHeight] = useState(DEFAULT_H);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHRef = useRef(DEFAULT_H);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom whenever a new log entry arrives.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const dy = startYRef.current - e.clientY;
      const next = Math.max(MIN_H, Math.min(MAX_H, startHRef.current + dy));
      setHeight(next);
    };
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onHandleDown = (e) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHRef.current = height;
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
  };

  const onHandleDoubleClick = () => {
    // Snap between collapsed and a comfortable expanded size.
    setHeight(h => (h > DEFAULT_H + 20 ? DEFAULT_H : 260));
  };

  // Render oldest→newest so newest sits at the visual bottom.
  const display = log.slice(0, 50).slice().reverse();

  return (
    <div
      className="bg-slate-900/85 text-xs flex flex-col flex-shrink-0 border-t border-slate-700"
      style={{ height: `${height}px` }}
    >
      <div
        onMouseDown={onHandleDown}
        onDoubleClick={onHandleDoubleClick}
        className="h-2 bg-slate-700 hover:bg-slate-600 cursor-ns-resize flex-shrink-0 flex items-center justify-center"
        title="Drag to resize log — double-click to toggle"
      >
        <div className="w-8 h-0.5 bg-slate-500 rounded" />
      </div>
      <div className="relative flex-1 min-h-0">
        {/* Fade-out mask at the top so older lines visually recede. */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-4 z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0))' }}
        />
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-2 py-1">
          {display.map((l, i) => (
            <div key={`${l.day}-${l.time}-${i}`} className="text-slate-300 mb-0.5 leading-tight">
              <span className="text-slate-500">D{l.day} {l.time}h:</span> {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
